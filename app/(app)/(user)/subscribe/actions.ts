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
    .eq("new_customer_only", true)
    .is("code", null);

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
): Promise<{ promo: PromoRow | null; error?: string }> {
  const { data } = await admin
    .from("promotions")
    .select(
      "id, code, discount_percent, start_at, end_at, is_active, archived_at, new_customer_only, max_redemptions, max_redemptions_per_user",
    )
    .eq("code", coupon)
    .maybeSingle();

  if (!data) return { promo: null, error: "Kode kupon tidak ditemukan." };
  const p = data as PromoRow;

  if (!p.is_active) return { promo: null, error: "Kupon tidak aktif." };
  if (p.archived_at) return { promo: null, error: "Kupon sudah diarsipkan." };
  if (!isActiveWindow(p.start_at, p.end_at))
    return { promo: null, error: "Kupon belum mulai atau sudah berakhir." };
  if (p.new_customer_only && !isNew)
    return { promo: null, error: "Kupon hanya untuk pengguna baru." };

  const okPlan = await promoApplicableToPlan(admin, p.id, planId);
  if (!okPlan)
    return { promo: null, error: "Kupon tidak berlaku untuk paket ini." };

  const okQuota = await canRedeemPromo(admin, p, userId);
  if (!okQuota) return { promo: null, error: "Kuota penggunaan kupon habis." };

  return { promo: p };
}

export async function checkCouponAction(code: string, planId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { error: "Harap login terlebih dahulu." };
  }

  const userId = auth.user.id;
  const admin = createAdminClient();

  // Validate plan existence
  const { data: plan } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("id", planId)
    .maybeSingle();

  if (!plan) {
    return { error: "Plan tidak ditemukan." };
  }

  const isNew = await isNewCustomer(admin, userId);

  const { promo, error } = await getPromoByCoupon(
    admin,
    code.toUpperCase(),
    planId,
    userId,
    isNew,
  );

  if (!promo) {
    return {
      error: error || "Kupon tidak valid.",
    };
  }

  return {
    success: true,
    discount_percent: promo.discount_percent,
    code: promo.code,
    message: `Kupon berhasil! Hemat ${promo.discount_percent}%`,
  };
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

  /* 3️⃣ Promo Logic (Stacking: Auto + Coupon) */
  let autoPromo: PromoRow | null = null;
  if (isNew) {
    autoPromo = await pickBestAutoNewCustomerPromo(admin, planId, userId);
  }

  let couponPromo: PromoRow | null = null;
  if (coupon) {
    const res = await getPromoByCoupon(admin, coupon, planId, userId, isNew);
    if (res.error) {
      // If coupon is invalid, redirect with error (user expects coupon to work)
      // or we could fall back to auto-promo only, but that might be confusing.
      // Given the UI validates it, a server error means it likely expired or quota full.
      redirect(`/subscribe?error=${encodeURIComponent(res.error)}`);
    }
    couponPromo = res.promo;
  }

  // Calculate stacked discount
  const autoPercent = autoPromo?.discount_percent ?? 0;
  const couponPercent = couponPromo?.discount_percent ?? 0;

  // Logic: Stack them, capped at 100%
  const discountPercent = clampInt(autoPercent + couponPercent, 0, 100);

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

  // Check if intent matches our promo combo
  // We prefer autoPromo as the primary promotion_id if it exists,
  // so that payment_intents shows: promotion_id (Auto) + coupon_code (Coupon).
  // If no auto promo, we use the coupon promo as the promotion_id.
  const primaryPromoId = autoPromo?.id ?? couponPromo?.id;

  if (primaryPromoId) {
    q = q.eq("promotion_id", primaryPromoId);
  } else {
    q = q.is("promotion_id", null);
  }

  if (coupon) {
    q = q.eq("coupon_code", coupon);
  } else {
    q = q.is("coupon_code", null);
  }

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

  /* 6️⃣ Create intent baru (Tanpa Reservasi - Atomic saat Payment) */
  const EXPIRY_MINUTES = 30;
  const expiresAt = new Date(
    Date.now() + EXPIRY_MINUTES * 60 * 1000,
  ).toISOString();

  /* Create intent manually (No pre-redemption) */
  const { data: intent, error: intentError } = await admin
    .from("payment_intents")
    .insert({
      user_id: userId,
      plan_id: planId,
      promotion_id: primaryPromoId ?? null,
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

  if (intentError || !intent?.id) {
    console.error("Intent Error:", intentError);
    redirect("/subscribe?error=intent_failed");
  }

  // Kita TIDAK lagi melakukan insert ke promotion_redemptions di sini.
  // Redemption akan dilakukan saat webhook payment sukses diterima.

  redirect(`/subscribe/pay?intent=${intent.id}`);
}
