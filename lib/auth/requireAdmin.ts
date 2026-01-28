import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) return { ok: false as const, reason: "UNAUTH" };

  const user = userRes.user;

  // optional: whitelist email admin
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (adminEmail && (user.email || "").toLowerCase() !== adminEmail) {
    return { ok: false as const, reason: "NOT_ADMIN" };
  }

  // cek role admin di profiles (aman karena select_own)
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) return { ok: false as const, reason: "PROFILE_ERR" };
  if (!profile || profile.role !== "admin")
    return { ok: false as const, reason: "NOT_ADMIN" };

  return { ok: true as const, user };
}
