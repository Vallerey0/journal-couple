"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type ApplyResult = {
  basePrice: number;
  discountPercentApplied: number;
  finalPrice: number;
  promotionId: string | null;
  note?: string;
};

function toInt(v: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

function toStr(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function isNewCustomer(supabase: any, userId: string) {
  // definisi user baru: belum pernah subscription berbayar
  // sementara: cek dari profiles.subscription_status
  const { data: p } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();

  return (p?.subscription_status ?? "inactive") !== "active";
}

async function getValidPromotionForCheckout(opts: {
  supabase: any;
  userId: string;
  couponCode?: string;
  planId: string;
}) {
  const { supabase, userId, couponCode, planId } = opts;

  // promo hanya yang archived_at IS NULL dan start/end valid
  // kalau couponCode ada: cari by code
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("promotions")
    .select(
      "id, code, discount_percent, start_at, end_at, new_customer_only, max_redemptions, max_redemptions_per_user, applies_to_all_plans"
    )
    .is("archived_at", null)
    .lte("start_at", nowIso);

  // end_at null = unlimited
  query = query.or(`end_at.is.null,end_at.gte.${nowIso}`);

  if (couponCode) {
    query = query.eq("code", couponCode.toUpperCase());
  } else {
    // tanpa kupon: boleh pilih promo auto (code null)
    query = query.is("code", null);
  }

  // ambil promo terbaru dulu (biar predictable)
  const { data: promo, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!promo) return null;

  // cek plan eligibility kalau tidak applies_to_all_plans
  if (!promo.applies_to_all_plans) {
    const { data: piv, error: pivErr } = await supabase
      .from("promotion_plans")
      .select("plan_id")
      .eq("promotion_id", promo.id)
      .eq("plan_id", planId)
      .maybeSingle();

    if (pivErr) throw pivErr;
    if (!piv) return null;
  }

  // cek new_customer_only
  if (promo.new_customer_only) {
    const ok = await isNewCustomer(supabase, userId);
    if (!ok) return null;
  }

  // NOTE: kuota & per-user redemption akan kita enforce penuh setelah webhook + tabel promotion_redemptions ready.
  // Untuk sekarang (pre-payment) kita hanya lakukan soft check jika table promotion_redemptions sudah ada.
  // Kalau belum ada, skip biar tidak ngeblok.
  try {
    if (promo.max_redemptions) {
      const { count } = await supabase
        .from("promotion_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("promotion_id", promo.id);

      if ((count ?? 0) >= promo.max_redemptions) return null;
    }

    if (promo.max_redemptions_per_user) {
      const { count } = await supabase
        .from("promotion_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("promotion_id", promo.id)
        .eq("user_id", userId);

      if ((count ?? 0) >= promo.max_redemptions_per_user) return null;
    }
  } catch {
    // table belum ada -> skip
  }

  return promo as {
    id: string;
    discount_percent: number;
  };
}

async function computePricing(opts: {
  supabase: any;
  userId: string;
  planId: string;
  couponCode?: string;
}): Promise<ApplyResult> {
  const { supabase, userId, planId, couponCode } = opts;

  const { data: plan, error: planErr } = await supabase
    .from("subscription_plans")
    .select("id, name, price_idr, duration_days, is_active")
    .eq("id", planId)
    .maybeSingle();

  if (planErr) throw planErr;
  if (!plan || !plan.is_active)
    throw new Error("Plan tidak valid / tidak aktif.");

  const basePrice = plan.price_idr as number;

  const promo = await getValidPromotionForCheckout({
    supabase,
    userId,
    couponCode: couponCode || undefined,
    planId,
  });

  const discountPercentApplied = promo
    ? clamp(promo.discount_percent, 0, 100)
    : 0;
  const finalPrice = Math.max(
    0,
    Math.round((basePrice * (100 - discountPercentApplied)) / 100)
  );

  return {
    basePrice,
    discountPercentApplied,
    finalPrice,
    promotionId: promo?.id ?? null,
    note: promo ? `Promo terpasang (${discountPercentApplied}%)` : undefined,
  };
}

export async function createCheckoutIntentAction(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  const user = auth.user;
  if (!user) redirect("/login");

  const planId = toStr(formData.get("plan_id"));
  const coupon = toStr(formData.get("coupon")) || null;

  if (!planId) throw new Error("Plan wajib dipilih.");

  const pricing = await computePricing({
    supabase,
    userId: user.id,
    planId,
    couponCode: coupon || undefined,
  });

  // simpan intent (snapshot harga)
  const { data: intent, error } = await supabase
    .from("payment_intents")
    .insert({
      user_id: user.id,
      plan_id: planId,
      promotion_id: pricing.promotionId,
      coupon_code: coupon,
      base_price_idr: pricing.basePrice,
      discount_percent_applied: pricing.discountPercentApplied,
      final_price_idr: pricing.finalPrice,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!intent?.id) throw new Error("Gagal membuat checkout.");

  // Next: kita akan buat endpoint /api/pay/midtrans untuk create Snap token dari intent.id
  redirect(`/subscribe/pay?intent=${intent.id}`);
}
