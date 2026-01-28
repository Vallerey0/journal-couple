import "server-only";
import { createClient } from "@/lib/supabase/server";

/* =====================================================
   GET ACTIVE COUPLE
   - hanya 1
   - archived_at IS NULL
   - return null jika belum ada
   ===================================================== */
export async function getActiveCouple() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getActiveCouple]", error);
    return null;
  }

  return data;
}

/* =====================================================
   GET ARCHIVED COUPLES
   - bisa lebih dari satu
   - untuk halaman restore
   ===================================================== */
export async function getArchivedCouples() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .eq("user_id", user.id)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (error) {
    console.error("[getArchivedCouples]", error);
    return [];
  }

  return data;
}
