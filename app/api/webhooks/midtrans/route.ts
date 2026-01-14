import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function sha512(input: string) {
  return crypto.createHash("sha512").update(input).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = String(body.order_id ?? "");
    const statusCode = String(body.status_code ?? "");
    const grossAmount = String(body.gross_amount ?? "");
    const signatureKey = String(body.signature_key ?? "");
    const transactionStatus = String(body.transaction_status ?? "");

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SECRET_KEY;

    if (!serverKey || !supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { message: "Missing env (MIDTRANS_SERVER_KEY / SUPABASE keys)" },
        { status: 500 }
      );
    }

    // ✅ Verify signature (wajib)
    const expected = sha512(orderId + statusCode + grossAmount + serverKey);
    if (expected !== signatureKey) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      );
    }

    // ✅ Paid condition
    const isPaid =
      transactionStatus === "settlement" || transactionStatus === "capture";
    if (!isPaid) {
      // pending/expire/cancel/deny dll: cukup ack
      return NextResponse.json({ message: "Not paid", transactionStatus });
    }

    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1) Cari intent berdasarkan midtrans_order_id (paling akurat)
    const { data: intent, error: intentErr } = await admin
      .from("payment_intents")
      .select(
        `
        id,
        user_id,
        plan_id,
        promotion_id,
        status,
        final_price_idr,
        midtrans_order_id,
        subscription_plans:plan_id (
          code,
          duration_days
        )
      `
      )
      .eq("midtrans_order_id", orderId)
      .maybeSingle();

    if (intentErr) {
      return NextResponse.json({ message: intentErr.message }, { status: 400 });
    }
    if (!intent) {
      return NextResponse.json(
        { message: "Intent not found" },
        { status: 404 }
      );
    }

    // idempotent: kalau sudah paid, stop
    if (intent.status === "paid") {
      return NextResponse.json({ message: "Already processed" });
    }

    // ✅ fix typing relasi: kadang dianggap array
    const plan = Array.isArray((intent as any).subscription_plans)
      ? (intent as any).subscription_plans[0]
      : (intent as any).subscription_plans;

    if (!plan?.code || !plan?.duration_days) {
      return NextResponse.json(
        { message: "Plan data missing" },
        { status: 400 }
      );
    }

    // 2) Update payment intent paid
    const { error: upIntentErr } = await admin
      .from("payment_intents")
      .update({ status: "paid" })
      .eq("id", intent.id);

    if (upIntentErr) {
      return NextResponse.json(
        { message: upIntentErr.message },
        { status: 400 }
      );
    }

    // 3) Insert redemption (kalau ada promo) - ignore duplicate (kalau webhook kepanggil 2x)
    if (intent.promotion_id) {
      await admin.from("promotion_redemptions").insert({
        promotion_id: intent.promotion_id,
        user_id: intent.user_id,
      });
    }

    // 4) Update profile jadi active
    const days = Number(plan.duration_days);
    const activeUntil = new Date();
    activeUntil.setDate(activeUntil.getDate() + days);

    const { error: upProfileErr } = await admin
      .from("profiles")
      .update({
        plan: String(plan.code),
        subscription_status: "active",
        active_until: activeUntil.toISOString(),
      })
      .eq("id", intent.user_id);

    if (upProfileErr) {
      return NextResponse.json(
        { message: upProfileErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Payment processed" });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Webhook error" },
      { status: 500 }
    );
  }
}
