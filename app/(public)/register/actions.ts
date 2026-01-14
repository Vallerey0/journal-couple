"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type State = { message?: string };

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export async function registerAction(
  _: State,
  formData: FormData
): Promise<State> {
  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = normalizePhone(String(formData.get("phone") || "").trim());
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm_password") || "");

  // server-side validation (final guard)
  if (!full_name) return { message: "Nama wajib diisi." };
  if (!email) return { message: "Email wajib diisi." };
  if (!isEmailValid(email)) return { message: "Email tidak valid." };
  if (!phone || phone.length < 10) return { message: "Nomor HP tidak valid." };
  if (password.length < 8) return { message: "Password minimal 8 karakter." };
  if (password !== confirm)
    return { message: "Konfirmasi password tidak sama." };

  const h = await headers();
  const origin =
    h.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const supabase = await createClient();

  // ✅ PENTING: query di dalam `next` harus di-encode
  const next = "/login?activated=1";
  const emailRedirectTo = `${origin}/auth/callback?type=signup&next=${encodeURIComponent(
    next
  )}&email=${encodeURIComponent(email)}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { full_name, phone },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();

    // mapping: email sudah terdaftar / sudah ada
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists") ||
      msg.includes("duplicate") ||
      msg.includes("taken")
    ) {
      return { message: "EMAIL_EXISTS" };
    }

    return { message: error.message };
  }

  // Halaman ini hanya untuk "cek email", bukan tujuan klik link aktivasi
  redirect(`/activate?email=${encodeURIComponent(email)}`);
}
