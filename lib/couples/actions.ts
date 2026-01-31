"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";

/* =====================================================
   INTERNAL GUARD
   Semua WRITE action wajib lewat sini
   ===================================================== */
async function guardSubscription() {
  const result = await requireActiveSubscription();
  if (!result.allowed) {
    redirect("/subscribe");
  }
}

/* =====================================================
   SLUG HELPERS
   ===================================================== */
function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Hapus karakter spesial
    .replace(/\s+/g, "-") // Spasi jadi dash
    .replace(/-+/g, "-"); // Collapse multiple dash
}

function takeFirstWords(name: string, count = 2) {
  return name.trim().split(/\s+/).slice(0, count).join(" ");
}

async function generateUniqueCoupleSlug(
  supabase: any,
  maleName: string,
  femaleName: string,
) {
  const malePart = normalizeSlug(takeFirstWords(maleName, 2));
  const femalePart = normalizeSlug(takeFirstWords(femaleName, 2));
  const baseSlug = `${malePart}-${femalePart}`;

  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("couples")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;

    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}

/* =====================================================
   SAVE / UPDATE COUPLE
   ===================================================== */
export async function saveCouple(formData: FormData): Promise<void> {
  const supabase = await createClient();

  /* ---------- AUTH ---------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* ---------- SUBSCRIPTION ---------- */
  await guardSubscription();

  /* ---------- CORE ---------- */
  const male_name = formData.get("male_name")?.toString().trim();
  const female_name = formData.get("female_name")?.toString().trim();
  const relationship_start_date =
    formData.get("relationship_start_date")?.toString() || null;

  const relationship_stage =
    (formData.get("relationship_stage")?.toString() as
      | "dating"
      | "engaged"
      | "married") || "dating";

  const married_at =
    relationship_stage === "married"
      ? formData.get("married_at")?.toString() || null
      : null;

  const notes = formData.get("notes")?.toString() || null;

  if (!male_name || !female_name || !relationship_start_date) {
    return;
  }

  /* ---------- PROFILE ---------- */
  const male_nickname = formData.get("male_nickname")?.toString() || null;
  const female_nickname = formData.get("female_nickname")?.toString() || null;

  const male_birth_date = formData.get("male_birth_date")?.toString() || null;
  const female_birth_date =
    formData.get("female_birth_date")?.toString() || null;

  const male_city = formData.get("male_city")?.toString() || null;
  const female_city = formData.get("female_city")?.toString() || null;

  const male_hobby = formData.get("male_hobby")?.toString() || null;
  const female_hobby = formData.get("female_hobby")?.toString() || null;

  /* ---------- ANNIVERSARY ---------- */
  const anniversary_note = formData.get("anniversary_note")?.toString() || null;

  /* ---------- PREFERENCES ---------- */
  const show_age = formData.get("show_age") === "on";
  const show_zodiac = formData.get("show_zodiac") === "on";

  /* ---------- THEME SYNC ---------- */
  // Get theme from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("theme_code")
    .eq("id", user.id)
    .single();

  const theme_code = profile?.theme_code || "aether";

  /* ---------- PAYLOAD ---------- */
  const payload = {
    user_id: user.id,

    male_name,
    female_name,
    relationship_start_date,
    relationship_stage,
    married_at,
    notes,

    male_nickname,
    female_nickname,
    male_birth_date,
    female_birth_date,
    male_city,
    female_city,
    male_hobby,
    female_hobby,

    anniversary_note,

    show_age,
    show_zodiac,

    theme_code, // Sync theme code

    updated_at: new Date().toISOString(),
  };

  /* ---------- UPSERT ---------- */
  const { data: existingCouple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (existingCouple) {
    await supabase.from("couples").update(payload).eq("id", existingCouple.id);
  } else {
    // Generate SLUG only on insert
    const slug = await generateUniqueCoupleSlug(
      supabase,
      male_name,
      female_name,
    );
    await supabase.from("couples").insert({ ...payload, slug });
  }

  revalidatePath("/couple");
  redirect("/couple");
}

/* =====================================================
   UPDATE COUPLE SLUG
   ===================================================== */
export async function updateCoupleSlug(
  coupleId: string,
  newSlug: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  /* ---------- AUTH ---------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  /* ---------- VALIDATION ---------- */
  const normalized = normalizeSlug(newSlug);

  if (!normalized || normalized.length < 3) {
    return { success: false, error: "Slug minimal 3 karakter" };
  }

  const RESERVED_SLUGS = new Set([
    "login",
    "register",
    "home",
    "settings",
    "subscribe",
    "api",
    "_next",
  ]);

  if (RESERVED_SLUGS.has(normalized)) {
    return { success: false, error: "Slug ini tidak boleh digunakan" };
  }

  /* ---------- CHECK OWNERSHIP ---------- */
  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("id", coupleId)
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return { success: false, error: "Couple tidak ditemukan" };
  }

  /* ---------- CHECK UNIQUENESS ---------- */
  const { data: existing } = await supabase
    .from("couples")
    .select("id")
    .eq("slug", normalized)
    .neq("id", coupleId) // Allow same slug if it's the current couple (though UI shouldn't trigger this)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Slug sudah dipakai couple lain" };
  }

  /* ---------- UPDATE ---------- */
  const { error } = await supabase
    .from("couples")
    .update({ slug: normalized, updated_at: new Date().toISOString() })
    .eq("id", coupleId);

  if (error) {
    console.error("[updateCoupleSlug]", error);
    return { success: false, error: "Gagal mengupdate slug" };
  }

  revalidatePath("/home");
  return { success: true };
}

/* =====================================================
   ARCHIVE COUPLE
   ===================================================== */
export async function archiveCouple(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await guardSubscription();

  await supabase
    .from("couples")
    .update({ archived_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("archived_at", null);

  revalidatePath("/couple");
  redirect("/couple");
}

/* =====================================================
   DELETE ACTIVE COUPLE (FIXED)
   ===================================================== */
export async function deleteCouple(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await guardSubscription();

  const confirmText =
    formData.get("confirm_text")?.toString().trim().toUpperCase() ?? "";

  if (confirmText !== "HAPUS") return;

  await supabase
    .from("couples")
    .delete()
    .eq("user_id", user.id)
    .is("archived_at", null); // ✅ hanya active

  revalidatePath("/couple");
  redirect("/couple");
}

/* =====================================================
   RESTORE ARCHIVED COUPLE
   ===================================================== */
export async function restoreCouple(coupleId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await guardSubscription();

  const { data: activeCouple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (activeCouple) return;

  await supabase
    .from("couples")
    .update({ archived_at: null })
    .eq("id", coupleId)
    .eq("user_id", user.id);

  revalidatePath("/couple");
  redirect("/couple");
}

/* =====================================================
   DELETE ARCHIVED COUPLE (FIXED)
   ===================================================== */
export async function deleteArchivedCouple(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const confirmText =
    formData.get("confirm_text")?.toString().trim().toUpperCase() ?? "";

  const coupleId = formData.get("couple_id")?.toString();

  if (confirmText !== "HAPUS" || !coupleId) {
    return;
  }

  const { error } = await supabase.from("couples").delete().eq("id", coupleId); // ⬅️ BIARKAN RLS YANG CEK user_id

  if (error) {
    console.error("[deleteArchivedCouple]", error);
    return;
  }

  revalidatePath("/couple/restore");
  redirect("/couple/restore");
}
