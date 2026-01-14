import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

type Body = {
  planId: string;
  coupon?: string; // optional
};

function midtransBaseUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function basicAuthHeader(serverKey: string) {
  const token = Buffer.from(`${serverKey}:`).toString("base64");
  return `Basic ${token}`;
}

export async function POST(req: Request) {
  const supabase = await createClient();

  // 1) auth user
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body?.planId)
    return NextResponse.json({ error: "planId required" }, { status: 400 });

  // 2) get plan
  const { data: plan, error: planErr } = await supabase
    .from("subscription_plans")
    .select("id, code, name, price_idr, duration_days, is_active")
    .eq("id", body.planId)
    .maybeSingle();

  if (planErr || !plan || !plan.is_active) {
    return NextResponse.json(
      { error: "Plan not found/inactive" },
      { status: 404 }
    );
  }

  // 3) find promo: coupon first, else auto promo
  const nowIso = new Date().toISOString();
  const coupon = (body.coupon || "").trim();
  let promo: any = null;

  if (coupon) {
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .eq("code", coupon)
      .eq("is_active", true)
      .lte("start_at", nowIso)
      .gt("end_at", nowIso)
      .maybeSingle();
    promo = data ?? null;
  } else {
    // auto promo (code is null) -> pick best discount
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .is("code", null)
      .eq("is_active", true)
      .lte("start_at", nowIso)
      .gt("end_at", nowIso)
      .order("discount_percent", { ascending: false })
      .limit(1);
    promo = data?.[0] ?? null;
  }

  // 4) validate promo against plan + new customer + quota + per user
  let discountPercent = 0;
  let promotionId: string | null = null;

  if (promo) {
    // 4a) plan scope
    if (!promo.applies_to_all_plans) {
      const { data: piv } = await supabase
        .from("promotion_plans")
        .select("plan_id")
        .eq("promotion_id", promo.id)
        .eq("plan_id", plan.id)
        .maybeSingle();

      if (!piv) promo = null; // promo not for this plan
    }

    // 4b) new customer only => must have never subscribed
    if (promo?.new_customer_only) {
      const { data: anySub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (anySub && anySub.length > 0) promo = null;
    }

    // 4c) quota max_redemptions
    if (promo?.max_redemptions) {
      const { count } = await supabase
        .from("promotion_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("promotion_id", promo.id);

      if ((count ?? 0) >= promo.max_redemptions) promo = null;
    }

    if (promo) {
      discountPercent = promo.discount_percent;
      promotionId = promo.id;
    }
  }

  const original = plan.price_idr;
  const finalAmount = Math.max(
    0,
    Math.round((original * (100 - discountPercent)) / 100)
  );

  // 5) create order_id
  const orderId = `JC-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  // 6) create payments row (pending)
  const { error: payErr } = await supabase.from("payments").insert({
    user_id: user.id,
    plan_id: plan.id,
    promotion_id: promotionId,
    provider: "midtrans",
    provider_order_id: orderId,
    gross_amount: finalAmount,
    status: "pending",
  });

  if (payErr) {
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  // 7) reserve redemption if promo used (A: unique per promo+user)
  if (promotionId) {
    const { error: redErr } = await supabase
      .from("promotion_redemptions")
      .insert({
        promotion_id: promotionId,
        user_id: user.id,
        plan_id: plan.id,
        order_id: orderId,
      });

    // kalau gagal karena unique (sudah pernah pakai) -> batalkan payment juga
    if (redErr) {
      await supabase.from("payments").delete().eq("provider_order_id", orderId);
      return NextResponse.json(
        { error: "Promo sudah pernah dipakai user ini." },
        { status: 400 }
      );
    }
  }

  // 8) request Snap token (backend) :contentReference[oaicite:2]{index=2}
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const base = midtransBaseUrl();

  const snapRes = await fetch(`${base}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(serverKey),
    },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: finalAmount },
      item_details: [
        { id: plan.code, price: finalAmount, quantity: 1, name: plan.name },
      ],
      customer_details: {
        email: user.email,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/finish`,
      },
    }),
  });

  const snapJson = await snapRes.json();
  if (!snapRes.ok) {
    // rollback payment if snap failed
    await supabase.from("payments").delete().eq("provider_order_id", orderId);
    if (promotionId)
      await supabase
        .from("promotion_redemptions")
        .delete()
        .eq("order_id", orderId);
    return NextResponse.json({ error: snapJson }, { status: 500 });
  }

  // return snap token + redirect_url to client
  return NextResponse.json({
    orderId,
    snapToken: snapJson.token,
    redirectUrl: snapJson.redirect_url,
    amount: finalAmount,
    discountPercent,
  });
}
