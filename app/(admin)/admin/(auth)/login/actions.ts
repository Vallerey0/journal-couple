"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type State = { message?: string };

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function adminLoginAction(
  _: State,
  formData: FormData
): Promise<State> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin").trim() || "/admin";

  if (!email) return { message: "Email wajib diisi." };
  if (!isEmailValid(email)) return { message: "Email tidak valid." };
  if (!password) return { message: "Password wajib diisi." };

  // ✅ SECURITY: whitelist admin email (server-side)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!ADMIN_EMAIL) {
    return { message: "ADMIN_EMAIL belum diset di environment." };
  }
  if (email !== ADMIN_EMAIL) {
    return { message: "Email ini tidak diizinkan untuk admin." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid") || msg.includes("credentials")) {
      return { message: "Email atau password salah." };
    }
    if (msg.includes("confirm") || msg.includes("verified")) {
      return { message: "Email belum diaktivasi. Silakan aktivasi dulu." };
    }
    return { message: error.message };
  }

  const userId = data.user?.id;
  if (!userId) return { message: "Gagal memuat user." };

  // ✅ tetap cek role admin (double safety)
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) return { message: profErr.message };

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    return { message: "Akun ini bukan admin." };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}
