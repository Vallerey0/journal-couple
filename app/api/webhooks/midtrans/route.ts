import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";

function sha512(input: string) {
  return crypto.createHash("sha512").update(input).digest("hex");
}

function isPaidStatus(s: string) {
  return s === "settlement" || s === "capture";
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
    if (!serverKey) {
      return NextResponse.json(
        { message: "MIDTRANS_SERVER_KEY missing" },
        { status: 500 }
      );
    }

    // verify signature
    const expected = sha512(orderId + statusCode + grossAmount + serverKey);
    if (expected !== signatureKey) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      );
    }

    if (!isPaidStatus(transactionStatus)) {
      // pending/expire/cancel/deny -> ack
      return NextResponse.json({ message: "Not paid", transactionStatus });
    }

    const admin = createAdminClient();

    // cari intent by midtrans_order_id
    const { data: intent, error: intentErr } = await admin
      .from("payment_intents")
      .select(
        `
        id,
        user_id,
        plan_id,
        promotion_id,
        base_price_idr,
        discount_percent_applied,
        discount_idr,
        final_price_idr,
        status,
        midtrans_order_id,
        subscription_plans:plan_id ( id, code, duration_days )
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

    // idempotent
    if (intent.status === "paid") {
      return NextResponse.json({ message: "Already processed" });
    }

    const plan = Array.isArray((intent as any).subscription_plans)
      ? (intent as any).subscription_plans[0]
      : (intent as any).subscription_plans;

    if (!plan?.id || !plan?.duration_days) {
      return NextResponse.json(
        { message: "Plan join missing" },
        { status: 400 }
      );
    }

    // 1) update intent -> paid
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

    // 2) insert payments (unik provider_order_id)
    const { data: payRow, error: payErr } = await admin
      .from("payments")
      .insert({
        user_id: intent.user_id,
        plan_id: intent.plan_id,
        promotion_id: intent.promotion_id,
        provider: "midtrans",
        provider_order_id: orderId,
        gross_amount: Number(intent.final_price_idr ?? 0),
        status: "paid",
        paid_at: new Date().toISOString(),
        intent_id: intent.id,
      })
      .select("id")
      .maybeSingle();

    // kalau duplicate order_id (webhook dipanggil 2x), abaikan
    if (payErr && !String(payErr.message).toLowerCase().includes("duplicate")) {
      return NextResponse.json({ message: payErr.message }, { status: 400 });
    }

    // 3) redemption (opsional) - simpan relasi intent/payment supaya rapih
    if (intent.promotion_id) {
      await admin.from("promotion_redemptions").insert({
        promotion_id: intent.promotion_id,
        user_id: intent.user_id,
        plan_id: intent.plan_id,
        intent_id: intent.id,
        payment_id: payRow?.id ?? null,
        provider_order_id: orderId,
        order_id: orderId,
      });
    }

    // 4) subscriptions: buat active sampai end
    const days = Number(plan.duration_days);
    const startAt = new Date();
    const endAt = new Date();
    endAt.setDate(endAt.getDate() + days);

    await admin.from("subscriptions").insert({
      user_id: intent.user_id,
      plan_id: plan.id,
      status: "active",
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    });

    // 5) profiles: update current_plan_id + active_until (+ optional trial clear)
    const { error: upProfileErr } = await admin
      .from("profiles")
      .update({
        current_plan_id: plan.id,
        active_until: endAt.toISOString(),
        // optional: trial_ends_at: null, trial_started_at: null,
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
