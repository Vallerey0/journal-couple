import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/* ================= Helpers ================= */

function sha512(input: string) {
  return crypto.createHash("sha512").update(input).digest("hex");
}

function safeStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function isPaidStatus(s: string) {
  return s === "settlement" || s === "capture";
}

function isFinalFailStatus(s: string) {
  return s === "expire" || s === "cancel" || s === "deny";
}

/* ================= Webhook ================= */

export async function POST(req: Request) {
  try {
    const body: any = await req.json();

    const orderId = safeStr(body.order_id);
    const statusCode = safeStr(body.status_code);
    const grossAmount = safeStr(body.gross_amount);
    const signatureKey = safeStr(body.signature_key);
    const transactionStatus = safeStr(body.transaction_status);
    const paymentType = safeStr(body.payment_type);

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return NextResponse.json(
        { message: "Incomplete Midtrans payload" },
        { status: 400 },
      );
    }

    if (!transactionStatus) {
      return NextResponse.json(
        { message: "Invalid Midtrans response" },
        { status: 400 },
      );
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { message: "Server key missing" },
        { status: 500 },
      );
    }

    /* ================= Verify Signature ================= */

    const expected = sha512(orderId + statusCode + grossAmount + serverKey);
    if (expected !== signatureKey) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 },
      );
    }

    const admin = createAdminClient();

    /* ================= Get Intent ================= */

    const { data: intent } = await admin
      .from("payment_intents")
      .select("id, final_price_idr, status")
      .eq("midtrans_order_id", orderId)
      .maybeSingle();

    if (!intent) {
      return NextResponse.json(
        { message: "Intent not found" },
        { status: 404 },
      );
    }

    /* ================= Validate Gross Amount ================= */

    if (
      Math.floor(Number(grossAmount)) !==
      Math.floor(Number(intent.final_price_idr))
    ) {
      return NextResponse.json(
        { message: "Gross amount mismatch" },
        { status: 400 },
      );
    }

    /* ================= Determine Channel ================= */

    let paymentChannel = paymentType;

    // Bank Transfer (VA)
    if (paymentType === "bank_transfer") {
      paymentChannel = safeStr(body.va_numbers?.[0]?.bank);
    }

    // CStore (Indomaret / Alfamart)
    if (paymentType === "cstore") {
      paymentChannel = safeStr(body.store);
    }

    // QRIS
    if (paymentType === "qris") {
      paymentChannel = "qris";
    }

    // E-Wallet
    if (
      paymentType === "gopay" ||
      paymentType === "dana" ||
      paymentType === "ovo" ||
      paymentType === "shopeepay"
    ) {
      paymentChannel = paymentType;
    }

    const paid = isPaidStatus(transactionStatus);
    const failedFinal = isFinalFailStatus(transactionStatus);

    /* ================= PAID ================= */

    if (paid) {
      const { error } = await admin.rpc("handle_payment_success", {
        p_intent_id: intent.id,
        p_provider_order_id: orderId,
        p_payment_type: paymentType,
        p_payment_channel: paymentChannel,
      });

      if (error) {
        console.error("RPC Error:", error);
        return NextResponse.json(
          { message: `RPC Failed: ${error.message}` },
          { status: 500 },
        );
      }

      console.log("Webhook processed:", {
        orderId,
        status: transactionStatus,
        paymentType,
        paymentChannel,
      });

      return NextResponse.json({ message: "Payment processed (RPC)" });
    }

    /* ================= FINAL FAILED ================= */

    if (failedFinal) {
      if (intent.status !== "expired" && intent.status !== "failed") {
        await admin
          .from("payment_intents")
          .update({ status: "expired" })
          .eq("id", intent.id);
      }

      console.log("Webhook processed (expired):", {
        orderId,
        status: transactionStatus,
      });

      return NextResponse.json({
        message: "Payment status updated (expired)",
      });
    }

    /* ================= Ignore Other Status ================= */

    console.log("Webhook ignored:", {
      orderId,
      status: transactionStatus,
    });

    return NextResponse.json({ message: "Webhook processed (ignored)" });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json(
      { message: e?.message ?? "Webhook error" },
      { status: 500 },
    );
  }
}
