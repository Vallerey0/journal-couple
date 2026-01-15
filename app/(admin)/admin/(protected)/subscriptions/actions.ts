"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function toInt(v: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

function toStr(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function toBool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * datetime-local dari input browser biasanya "YYYY-MM-DDTHH:mm"
 * Normalize -> timestamptz string dengan offset +07:00 (Asia/Jakarta)
 */
function normalizeJakartaTimestamptz(raw: string | null) {
  const v = (raw ?? "").trim();
  if (!v) return null;

  if (/[zZ]$/.test(v) || /[+-]\d{2}:\d{2}$/.test(v)) return v;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) {
    return `${v}:00+07:00`;
  }

  return v;
}

export async function createPlanAction(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const name = toStr(formData.get("name"));
  const price_idr = toInt(formData.get("price_idr"));
  const duration_days = toInt(formData.get("duration_days"));
  const sort_order = toInt(formData.get("sort_order"), 0);
  const description = toStr(formData.get("description")) || null;

  if (!name) throw new Error("Name wajib.");
  if (price_idr < 0) throw new Error("Harga tidak valid.");
  if (duration_days <= 0) throw new Error("Durasi harus > 0.");

  const baseCode = `${slugify(name)}_${duration_days}d`;

  let code = baseCode;
  for (let i = 2; i <= 50; i++) {
    const { data: exists, error: exErr } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (exErr) throw new Error(exErr.message);
    if (!exists) break;

    code = `${baseCode}-${i}`;
  }

  const { error } = await supabase.from("subscription_plans").insert({
    code,
    name,
    price_idr,
    duration_days,
    sort_order,
    description,
    is_active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/subscriptions");
}

export async function updatePlanAction(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const id = toStr(formData.get("id"));
  if (!id) throw new Error("ID plan kosong.");

  const name = toStr(formData.get("name"));
  const price_idr = toInt(formData.get("price_idr"));
  const duration_days = toInt(formData.get("duration_days"));
  const sort_order = toInt(formData.get("sort_order"), 0);
  const description = toStr(formData.get("description")) || null;

  if (!name) throw new Error("Name wajib.");
  if (price_idr < 0) throw new Error("Harga tidak valid.");
  if (duration_days <= 0) throw new Error("Durasi harus > 0.");

  const { error } = await supabase
    .from("subscription_plans")
    .update({
      name,
      price_idr,
      duration_days,
      sort_order,
      description,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/subscriptions");
}

export async function togglePlanActiveAction(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const id = toStr(formData.get("id"));
  const next = toBool(formData.get("next_active"));
  if (!id) throw new Error("ID plan kosong.");

  const { error } = await supabase
    .from("subscription_plans")
    .update({ is_active: next })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/subscriptions");
}

/**
 * ✅ helper: sync pivot promotion_plans agar sama persis dengan selectedPlanIds
 */
async function syncPromotionPlans(
  supabase: any,
  promotionId: string,
  selectedPlanIds: string[]
) {
  // bersihkan dulu
  const { error: delErr } = await supabase
    .from("promotion_plans")
    .delete()
    .eq("promotion_id", promotionId);

  if (delErr) throw new Error(delErr.message);

  // insert ulang
  if (selectedPlanIds.length > 0) {
    const rows = selectedPlanIds.map((plan_id) => ({
      promotion_id: promotionId,
      plan_id,
    }));

    const { error: insErr } = await supabase
      .from("promotion_plans")
      .insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
}

export async function createPromotionAction(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const name = toStr(formData.get("name"));
  const description = toStr(formData.get("description")) || null;

  const codeRaw = toStr(formData.get("code"));
  const code = codeRaw ? codeRaw.toUpperCase() : null;

  const discount_percent = toInt(formData.get("discount_percent"));

  const start_at = normalizeJakartaTimestamptz(toStr(formData.get("start_at")));
  const end_at =
    normalizeJakartaTimestamptz(toStr(formData.get("end_at"))) || null;

  const new_customer_only = toBool(formData.get("new_customer_only"));

  const max_redemptions_raw = toStr(formData.get("max_redemptions"));
  const max_redemptions =
    max_redemptions_raw === "" ? null : Number(max_redemptions_raw);

  // ✅ sekarang wajib plan picker
  const planIds = formData.getAll("plan_id").map((x) => String(x));

  if (!name) throw new Error("Nama promo wajib.");
  if (!(discount_percent >= 1 && discount_percent <= 100))
    throw new Error("Diskon harus 1-100%.");
  if (!start_at) throw new Error("Start wajib.");

  if (planIds.length === 0) {
    throw new Error("Pilih minimal 1 plan untuk promo ini.");
  }

  if (
    max_redemptions !== null &&
    (!Number.isFinite(max_redemptions) || max_redemptions <= 0)
  ) {
    throw new Error("Kuota (max redemptions) tidak valid.");
  }

  if (end_at) {
    const s = new Date(start_at).getTime();
    const e = new Date(end_at).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) {
      throw new Error("End harus setelah Start.");
    }
  }

  const { data: promo, error: promoErr } = await supabase
    .from("promotions")
    .insert({
      name,
      description,
      code,
      discount_percent,
      start_at,
      end_at,
      is_active: true,
      archived_at: null,
      new_customer_only,
      max_redemptions,
      max_redemptions_per_user: 1,
    })
    .select("id")
    .maybeSingle();

  if (promoErr) throw new Error(promoErr.message);
  if (!promo?.id) throw new Error("Gagal membuat promo.");

  await syncPromotionPlans(supabase, promo.id, planIds);

  revalidatePath("/admin/subscriptions");
}

/**
 * ✅ Update promo (aktif) dengan safety rule:
 * - Kalau promo SUDAH dipakai (ada redemption) => hanya boleh edit:
 *   name, description, end_at
 * - Kalau belum dipakai => boleh edit field inti + sync pivot plan
 */
export async function updatePromotionAction(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const id = toStr(formData.get("id"));
  if (!id) throw new Error("ID promo kosong.");

  const { data: existing, error: exErr } = await supabase
    .from("promotions")
    .select(
      "id, name, description, code, discount_percent, start_at, end_at, new_customer_only, max_redemptions, archived_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);
  if (!existing) throw new Error("Promo tidak ditemukan.");
  if (existing.archived_at)
    throw new Error("Promo sudah di-archive (read-only).");

  // cek apakah sudah pernah dipakai
  const { count: usedCount, error: cntErr } = await supabase
    .from("promotion_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("promotion_id", id);

  if (cntErr) throw new Error(cntErr.message);
  const used = (usedCount ?? 0) > 0;

  // input baru
  const name = toStr(formData.get("name"));
  const description = toStr(formData.get("description")) || null;

  const end_at =
    normalizeJakartaTimestamptz(toStr(formData.get("end_at"))) || null;

  // field inti (hanya kalau belum dipakai)
  const codeRaw = toStr(formData.get("code"));
  const code = codeRaw ? codeRaw.toUpperCase() : null;

  const discount_percent = toInt(formData.get("discount_percent"));
  const new_customer_only = toBool(formData.get("new_customer_only"));

  const max_redemptions_raw = toStr(formData.get("max_redemptions"));
  const max_redemptions =
    max_redemptions_raw === "" ? null : Number(max_redemptions_raw);

  // ✅ plan picker edit
  const planIds = formData.getAll("plan_id").map((x) => String(x));

  if (!name) throw new Error("Nama promo wajib.");

  if (end_at) {
    const s = new Date(existing.start_at).getTime();
    const e = new Date(end_at).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) {
      throw new Error("End harus setelah Start.");
    }
  }

  if (used) {
    // 🔒 locked fields + pivot dikunci
    const { error } = await supabase
      .from("promotions")
      .update({
        name,
        description,
        end_at,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/subscriptions");
    return;
  }

  // belum dipakai => boleh edit inti
  if (!(discount_percent >= 1 && discount_percent <= 100))
    throw new Error("Diskon harus 1-100%.");

  if (
    max_redemptions !== null &&
    (!Number.isFinite(max_redemptions) || max_redemptions <= 0)
  ) {
    throw new Error("Kuota (max redemptions) tidak valid.");
  }

  if (planIds.length === 0) {
    throw new Error("Pilih minimal 1 plan untuk promo ini.");
  }

  const { error } = await supabase
    .from("promotions")
    .update({
      name,
      description,
      code,
      discount_percent,
      end_at,
      new_customer_only,
      max_redemptions,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // ✅ sync pivot
  await syncPromotionPlans(supabase, id, planIds);

  revalidatePath("/admin/subscriptions");
}

export async function archivePromotionAction(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const id = toStr(formData.get("id"));
  if (!id) throw new Error("ID promo kosong.");

  const { data: existing, error: readErr } = await supabase
    .from("promotions")
    .select("id, archived_at")
    .eq("id", id)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);
  if (!existing) throw new Error("Promo tidak ditemukan.");
  if (existing.archived_at) {
    revalidatePath("/admin/subscriptions");
    return;
  }

  const { error } = await supabase
    .from("promotions")
    .update({
      is_active: false,
      archived_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/subscriptions");
}
