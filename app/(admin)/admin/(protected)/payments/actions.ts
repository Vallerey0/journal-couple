"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ResyncResult = {
  success: boolean;
  message: string;
  details?: any;
};

export async function resyncPayment(intentId: string): Promise<ResyncResult> {
  if (!intentId) {
    return { success: false, message: "Intent ID is required" };
  }

  // 1. Check Midtrans Status
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return {
      success: false,
      message: "Server configuration error (Key missing)",
    };
  }

  const supabase = createAdminClient();
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  const adminUserId = user?.id || null;

  // Get intent details
  const { data: intent, error: intentError } = await supabase
    .from("payment_intents")
    .select("id, midtrans_order_id, final_price_idr, status, processed_at")
    .eq("id", intentId)
    .single();

  if (intentError || !intent) {
    return { success: false, message: "Payment intent not found" };
  }

  // 0. Check if already processed
  if (
    intent.status !== "pending" &&
    intent.status !== "failed" &&
    intent.status !== "expired"
  ) {
    // If it's already paid/processed, we don't need to resync unless it's a specific recover case
    // But user said: if intent.status !== "pending" return "Already processed"
    // However, what if status is 'expired' but user actually paid?
    // The user logic says:
    // if (intent.status !== "pending") { return "Already processed" }
    // I should follow this strict rule first.
    if (intent.status === "paid") {
      return { success: true, message: "Already processed (Status: Paid)" };
    }
    // If status is expired/failed, maybe we should allow re-check?
    // User pseudo code:
    // if (intent.status !== "pending") { return "Already processed" }
    // But wait, if status is 'expired' (e.g. by timeout) but user actually paid, we might want to recover?
    // User said: "Resync endpoint memang seharusnya: 🔧 Emergency recovery tool"
    // And: "Jika settlement / capture Dan intent masih pending Jalankan RPC"
    // So if intent is NOT pending, we assume it is final.
    // But if it is 'expired' in our DB, but 'settlement' in Midtrans, we should probably recover it?
    // User Pseudo: if (intent.status !== "pending") return "Already processed"
    // I will stick to user instruction. If status is NOT pending, return.
  }

  // Re-read user input carefully:
  // "if (intent.status !== "pending") { return "Already processed" }"
  // Okay, I will follow this.

  if (intent.status !== "pending") {
    return {
      success: false,
      message: `Intent status is '${intent.status}'. Already processed or final.`,
    };
  }

  // Use ONLY intent.midtrans_order_id
  const orderId = intent.midtrans_order_id;

  if (!orderId) {
    return {
      success: false,
      message: "No Order ID associated with this intent in Database.",
    };
  }

  let midtransStatus = null;
  let triggeredRpc = false;

  try {
    // 2. Call Midtrans API
    const authString = Buffer.from(serverKey + ":").toString("base64");
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl =
      process.env.MIDTRANS_API_URL ||
      (isProd
        ? "https://api.midtrans.com"
        : "https://api.sandbox.midtrans.com");

    const midtransUrl = `${baseUrl}/v2/${orderId}/status`;

    const res = await fetch(midtransUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      cache: "no-store", // Ensure fresh data
    });

    const midtransData = await res.json();
    midtransStatus =
      midtransData.transaction_status || midtransData.status_code;

    // 404 Handling - Non-fatal
    if (
      midtransData.status_code === "404" ||
      !midtransData.transaction_status
    ) {
      // Log attempt
      await supabase.from("payment_resync_logs").insert({
        intent_id: intentId,
        order_id: orderId,
        midtrans_status: "404/Not Found",
        midtrans_response_code: midtransData.status_code,
        triggered_rpc: false,
        admin_user_id: adminUserId,
        details: midtransData,
      });

      return {
        success: false,
        message: "Transaction not available yet in Midtrans (404/Not Found)",
      };
    }

    const transactionStatus = midtransData.transaction_status;

    // 3. Logic based on status
    if (["settlement", "capture"].includes(transactionStatus)) {
      // Run RPC
      const { error: rpcError } = await supabase.rpc("process_paid_payment", {
        p_intent_id: intentId,
        p_provider_order_id: orderId,
      });

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        await supabase.from("payment_resync_logs").insert({
          intent_id: intentId,
          order_id: orderId,
          midtrans_status: transactionStatus,
          midtrans_response_code: midtransData.status_code,
          triggered_rpc: true,
          admin_user_id: adminUserId,
          error_message: rpcError.message,
          details: { error: rpcError, midtrans: midtransData },
        });
        return {
          success: false,
          message: `RPC Failed: ${rpcError.message}`,
        };
      }

      triggeredRpc = true;
      revalidatePath("/admin/payments");

      await supabase.from("payment_resync_logs").insert({
        intent_id: intentId,
        order_id: orderId,
        midtrans_status: transactionStatus,
        midtrans_response_code: midtransData.status_code,
        triggered_rpc: true,
        admin_user_id: adminUserId,
        details: midtransData,
      });

      return {
        success: true,
        message: "Payment synced successfully (RPC executed).",
      };
    } else if (["expire", "cancel", "deny"].includes(transactionStatus)) {
      // Update intent to expired
      await supabase
        .from("payment_intents")
        .update({ status: "expired" })
        .eq("id", intentId);

      revalidatePath("/admin/payments");

      await supabase.from("payment_resync_logs").insert({
        intent_id: intentId,
        order_id: orderId,
        midtrans_status: transactionStatus,
        midtrans_response_code: midtransData.status_code,
        triggered_rpc: false,
        admin_user_id: adminUserId,
        details: midtransData,
      });

      return {
        success: true,
        message: `Status synced to ${transactionStatus} (Expired/Failed)`,
      };
    } else {
      // Pending or other status
      await supabase.from("payment_resync_logs").insert({
        intent_id: intentId,
        order_id: orderId,
        midtrans_status: transactionStatus,
        midtrans_response_code: midtransData.status_code,
        triggered_rpc: false,
        admin_user_id: adminUserId,
        details: midtransData,
      });

      return {
        success: false,
        message: `Midtrans status: ${transactionStatus}. Not paid yet.`,
      };
    }
  } catch (error: any) {
    console.error("Resync error:", error);
    // Log error
    try {
      await supabase.from("payment_resync_logs").insert({
        intent_id: intentId,
        order_id: orderId,
        midtrans_status: "ERROR",
        triggered_rpc: false,
        admin_user_id: adminUserId,
        error_message: error.message,
        details: { error: error.message },
      });
    } catch (e) {
      // ignore log error
    }

    return {
      success: false,
      message: error.message || "Failed to resync payment",
    };
  }
}

export async function getMidtransData(intentId: string) {
  if (!intentId) return { error: "Intent ID required" };

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return { error: "Server Key missing" };

  const supabase = createAdminClient();
  const { data: intent } = await supabase
    .from("payment_intents")
    .select("midtrans_order_id")
    .eq("id", intentId)
    .single();

  if (!intent?.midtrans_order_id) return { error: "No Order ID found" };

  const authString = Buffer.from(serverKey + ":").toString("base64");
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const baseUrl =
    process.env.MIDTRANS_API_URL ||
    (isProd ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");

  try {
    const res = await fetch(
      `${baseUrl}/v2/${intent.midtrans_order_id}/status`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        cache: "no-store",
      },
    );
    const json = await res.json();
    return { data: json };
  } catch (e: any) {
    return { error: e.message };
  }
}
