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
function pickPaymentMethod(body: any) {
  const payment_type = body?.payment_type ? String(body.payment_type) : null;
  let payment_channel: string | null = null;

  if (payment_type === "bank_transfer") {
    const va = Array.isArray(body?.va_numbers) ? body.va_numbers[0] : null;
    const bank = va?.bank ? String(va.bank).toUpperCase() : null;
    payment_channel = bank ? `${bank} VA` : "VA";
  }
  if (payment_type === "echannel") payment_channel = "Mandiri Bill";
  if (payment_type === "qris") payment_channel = "QRIS";
  if (payment_type === "gopay") payment_channel = "GoPay";
  if (!payment_channel && payment_type) payment_channel = payment_type;

  return { payment_type, payment_channel };
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

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { message: "Server key missing" },
        { status: 500 },
      );
    }

    // verify signature
    const expected = sha512(orderId + statusCode + grossAmount + serverKey);
    if (expected !== signatureKey) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 },
      );
    }

    const admin = createAdminClient();

    // ambil intent
    const { data: intent } = await admin
      .from("payment_intents")
      .select(
        `
        id,
        user_id,
        plan_id,
        promotion_id,
        final_price_idr,
        status,
        processed_at,
        subscription_plans:plan_id ( id, duration_days )
      `,
      )
      .eq("midtrans_order_id", orderId)
      .maybeSingle();

    if (!intent) {
      return NextResponse.json(
        { message: "Intent not found" },
        { status: 404 },
      );
    }

    const plan = Array.isArray((intent as any).subscription_plans)
      ? (intent as any).subscription_plans[0]
      : (intent as any).subscription_plans;

    if (!plan?.id || !plan?.duration_days) {
      return NextResponse.json({ message: "Plan missing" }, { status: 400 });
    }

    const paid = isPaidStatus(transactionStatus);
    const failedFinal = isFinalFailStatus(transactionStatus);

    // update intent status (tracking)
    const nextIntentStatus = paid
      ? "paid"
      : failedFinal
        ? "expired"
        : "pending";
    if (intent.status !== "paid") {
      await admin
        .from("payment_intents")
        .update({ status: nextIntentStatus })
        .eq("id", intent.id);
    }

    // payments (FINAL SAJA)
    const nextPaymentStatus = paid
      ? "paid"
      : transactionStatus === "expire"
        ? "expired"
        : failedFinal
          ? "failed"
          : null;

    let paymentId: string | null = null;

    if (nextPaymentStatus) {
      const method = pickPaymentMethod(body);

      const { data: existingPay } = await admin
        .from("payments")
        .select("id, status")
        .eq("provider_order_id", orderId)
        .maybeSingle();

      if (!existingPay) {
        const { data: p } = await admin
          .from("payments")
          .insert({
            user_id: intent.user_id,
            plan_id: intent.plan_id,
            promotion_id: intent.promotion_id,
            provider: "midtrans",
            provider_order_id: orderId,
            gross_amount: Number(intent.final_price_idr ?? 0),
            status: nextPaymentStatus,
            paid_at: paid ? new Date().toISOString() : null,
            intent_id: intent.id,
            payment_type: method.payment_type,
            payment_channel: method.payment_channel,
          })
          .select("id")
          .maybeSingle();

        paymentId = p?.id ?? null;
      } else {
        paymentId = existingPay.id;
        if (existingPay.status !== "paid") {
          await admin
            .from("payments")
            .update({
              status: nextPaymentStatus,
              paid_at: paid ? new Date().toISOString() : null,
            })
            .eq("id", existingPay.id);
        }
      }
    }

    // kalau belum PAID → STOP
    if (!paid || !paymentId) {
      return NextResponse.json({ message: "Webhook processed (non-paid)" });
    }

    // anti double process
    const { data: locked } = await admin
      .from("payment_intents")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", intent.id)
      .is("processed_at", null)
      .select("id")
      .maybeSingle();

    if (!locked?.id) {
      return NextResponse.json({ message: "Already processed" });
    }

    // PROMO REDEMPTION — DARI PAYMENT
    if (intent.promotion_id) {
      await admin.from("promotion_redemptions").insert({
        promotion_id: intent.promotion_id,
        user_id: intent.user_id,
        plan_id: intent.plan_id,
        payment_id: paymentId,
      });
    }

    // SUBSCRIPTION & PROFILE
    const { data: prof } = await admin
      .from("profiles")
      .select("active_until")
      .eq("id", intent.user_id)
      .maybeSingle();

    const now = new Date();
    const prev = prof?.active_until ? new Date(prof.active_until) : null;
    const base = prev && prev > now ? prev : now;

    const endAt = new Date(base);
    endAt.setDate(endAt.getDate() + plan.duration_days);

    await admin
      .from("subscriptions")
      .update({ status: "expired", end_at: base.toISOString() })
      .eq("user_id", intent.user_id)
      .eq("status", "active");

    await admin.from("subscriptions").insert({
      user_id: intent.user_id,
      plan_id: plan.id,
      status: "active",
      start_at: base.toISOString(),
      end_at: endAt.toISOString(),
    });

    // ⛔ TIDAK MENYENTUH trial_started_at & trial_ends_at
    await admin
      .from("profiles")
      .update({
        current_plan_id: plan.id,
        active_until: endAt.toISOString(),
      })
      .eq("id", intent.user_id);

    return NextResponse.json({ message: "Payment processed (final)" });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Webhook error" },
      { status: 500 },
    );
  }
}
