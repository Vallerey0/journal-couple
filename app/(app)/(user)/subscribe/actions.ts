"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* =========================
 * Utils
 * ========================= */
function toStr(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isActiveWindow(startAt: string | null, endAt: string | null) {
  const now = Date.now();
  const s = startAt ? new Date(startAt).getTime() : null;
  const e = endAt ? new Date(endAt).getTime() : null;
  if (s && s > now) return false;
  if (e && e <= now) return false;
  return true;
}

/* =========================
 * Types
 * ========================= */
type PromoRow = {
  id: string;
  code: string | null;
  discount_percent: number;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  archived_at: string | null;
  new_customer_only: boolean;
  max_redemptions: number | null;
  max_redemptions_per_user: number | null;
};

/* =========================
 * Business helpers
 * ========================= */
async function isNewCustomer(admin: any, userId: string) {
  const [{ count: paidCount }, { count: subCount }] = await Promise.all([
    admin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "paid"),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return (paidCount ?? 0) === 0 && (subCount ?? 0) === 0;
}

async function promoApplicableToPlan(
  admin: any,
  promoId: string,
  planId: string,
) {
  const { data } = await admin
    .from("promotion_plans")
    .select("promotion_id, plan_id")
    .eq("promotion_id", promoId)
    .eq("plan_id", planId)
    .maybeSingle();

  return !!data;
}

async function canRedeemPromo(admin: any, promo: PromoRow, userId: string) {
  if (promo.max_redemptions !== null) {
    const { count } = await admin
      .from("promotion_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promotion_id", promo.id);

    if ((count ?? 0) >= promo.max_redemptions) return false;
  }

  const perUserLimit = promo.max_redemptions_per_user ?? 1;
  if (perUserLimit > 0) {
    const { count } = await admin
      .from("promotion_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promotion_id", promo.id)
      .eq("user_id", userId);

    if ((count ?? 0) >= perUserLimit) return false;
  }

  return true;
}

async function pickBestAutoNewCustomerPromo(
  admin: any,
  planId: string,
  userId: string,
): Promise<PromoRow | null> {
  const { data: promos } = await admin
    .from("promotions")
    .select(
      "id, code, discount_percent, start_at, end_at, is_active, archived_at, new_customer_only, max_redemptions, max_redemptions_per_user",
    )
    .eq("is_active", true)
    .is("archived_at", null)
    .eq("new_customer_only", true);

  const list = (promos ?? [])
    .filter((p: any) => isActiveWindow(p.start_at, p.end_at))
    .sort(
      (a: any, b: any) => (b.discount_percent ?? 0) - (a.discount_percent ?? 0),
    ) as PromoRow[];

  for (const p of list) {
    const okPlan = await promoApplicableToPlan(admin, p.id, planId);
    if (!okPlan) continue;

    const okQuota = await canRedeemPromo(admin, p, userId);
    if (!okQuota) continue;

    return p;
  }

  return null;
}

async function getPromoByCoupon(
  admin: any,
  coupon: string,
  planId: string,
  userId: string,
  isNew: boolean,
): Promise<PromoRow | null> {
  const { data } = await admin
    .from("promotions")
    .select(
      "id, code, discount_percent, start_at, end_at, is_active, archived_at, new_customer_only, max_redemptions, max_redemptions_per_user",
    )
    .eq("code", coupon)
    .maybeSingle();

  if (!data) return null;
  const p = data as PromoRow;

  if (!p.is_active) return null;
  if (p.archived_at) return null;
  if (!isActiveWindow(p.start_at, p.end_at)) return null;
  if (p.new_customer_only && !isNew) return null;

  const okPlan = await promoApplicableToPlan(admin, p.id, planId);
  if (!okPlan) return null;

  const okQuota = await canRedeemPromo(admin, p, userId);
  if (!okQuota) return null;

  return p;
}

/* =========================
 * Action (FINAL)
 * ========================= */
export async function createCheckoutIntentAction(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) redirect("/login?next=/subscribe");

  const planId = toStr(formData.get("plan_id"));
  const couponRaw = toStr(formData.get("coupon"));
  const coupon = couponRaw ? couponRaw.toUpperCase() : "";

  if (!planId) redirect("/subscribe?error=plan_required");

  const admin = createAdminClient();

  /* 1️⃣ Plan aktif */
  const { data: plan } = await admin
    .from("subscription_plans")
    .select("id, price_idr, is_active")
    .eq("id", planId)
    .maybeSingle();

  if (!plan || !plan.is_active) {
    redirect("/subscribe?error=plan_invalid");
  }

  const basePrice = Number(plan.price_idr ?? 0);

  /* 2️⃣ User baru? */
  const isNew = await isNewCustomer(admin, userId);

  /* 3️⃣ Promo */
  let promo: PromoRow | null = null;
  if (coupon) {
    promo = await getPromoByCoupon(admin, coupon, planId, userId, isNew);
  } else if (isNew) {
    promo = await pickBestAutoNewCustomerPromo(admin, planId, userId);
  }

  const discountPercent = promo
    ? clampInt(Number(promo.discount_percent ?? 0), 0, 100)
    : 0;

  const discountIdr = Math.floor((basePrice * discountPercent) / 100);
  const finalPrice = Math.max(0, basePrice - discountIdr);

  /* 4️⃣ Reuse intent jika masih valid */
  let q = admin
    .from("payment_intents")
    .select("id, expires_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .eq("plan_id", planId)
    .eq("final_price_idr", finalPrice);

  q = coupon ? q.eq("coupon_code", coupon) : q.is("coupon_code", null);
  q = promo?.id ? q.eq("promotion_id", promo.id) : q.is("promotion_id", null);

  const { data: existing } = await q
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    existing?.id &&
    existing.expires_at &&
    new Date(existing.expires_at).getTime() > Date.now()
  ) {
    redirect(`/subscribe/pay?intent=${existing.id}`);
  }

  /* 5️⃣ Expire intent lama yang SUDAH lewat waktu */
  await admin
    .from("payment_intents")
    .update({
      status: "expired",
      processed_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", "pending")
    .lte("expires_at", new Date().toISOString());

  /* 6️⃣ Create intent baru */
  const EXPIRY_MINUTES = 30;
  const expiresAt = new Date(
    Date.now() + EXPIRY_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: intent, error } = await admin
    .from("payment_intents")
    .insert({
      user_id: userId,
      plan_id: planId,
      promotion_id: promo?.id ?? null,
      coupon_code: coupon || null,

      base_price_idr: basePrice,
      discount_percent_applied: discountPercent,
      discount_idr: discountIdr,
      final_price_idr: finalPrice,

      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .maybeSingle();

  if (error || !intent?.id) {
    redirect("/subscribe?error=intent_failed");
  }

  /* 7️⃣ Lock promo */
  if (promo?.id) {
    await admin.from("promotion_redemptions").insert({
      promotion_id: promo.id,
      user_id: userId,
      plan_id: planId,
      intent_id: intent.id,
    });
  }

  redirect(`/subscribe/pay?intent=${intent.id}`);
}
