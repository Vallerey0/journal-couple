"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type State = { message?: string };

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

async function getOriginFromHeaders() {
  const h = await headers();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const xfHost = h.get("x-forwarded-host");
  const host = xfHost ?? h.get("host");

  if (host) return `${proto}://${host}`;

  return (
    h.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

function mapAuthErrorToMessage(raw: any) {
  if (typeof raw !== "string") return "Terjadi kesalahan sistem.";
  const msg = raw.toLowerCase();

  if (
    msg.includes("already") ||
    msg.includes("registered") ||
    msg.includes("exists") ||
    msg.includes("duplicate") ||
    msg.includes("taken")
  ) {
    return "EMAIL_EXISTS";
  }

  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Terlalu sering. Coba lagi sebentar.";
  }

  if (msg.includes("password")) {
    return "Password tidak memenuhi syarat.";
  }

  return raw;
}

export async function registerAction(
  _: State,
  formData: FormData,
): Promise<State> {
  try {
    const full_name = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const phone = normalizePhone(String(formData.get("phone") || "").trim());
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm_password") || "");

    // validation (server guard)
    if (!full_name) return { message: "Nama wajib diisi." };
    if (!email) return { message: "Email wajib diisi." };
    if (!isEmailValid(email)) return { message: "Email tidak valid." };
    if (!phone || phone.length < 10)
      return { message: "Nomor HP tidak valid." };
    if (password.length < 8) return { message: "Password minimal 8 karakter." };
    if (password.length > 72) {
      return { message: "Password terlalu panjang." };
    }
    if (password !== confirm)
      return { message: "Konfirmasi password tidak sama." };

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profile) {
      const { data: userData } = await admin.auth.admin.getUserById(profile.id);

      const authUser = userData?.user;

      if (authUser && !authUser.email_confirmed_at) {
        redirect(`/login?unverified=1&email=${encodeURIComponent(email)}`);
      }

      return { message: "EMAIL_EXISTS" };
    }

    const origin = await getOriginFromHeaders();
    const supabase = await createClient();

    // ✅ penting: hanya arahkan ke /auth/confirm (tanpa next)
    // next=/login?activated=1 sudah dikunci di Email Template
    const emailRedirectTo = `${origin}/auth/confirm`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { full_name, phone },
      },
    });

    if (error) return { message: mapAuthErrorToMessage(error.message) };

    // Jika sukses tapi user null (sangat jarang) atau user.identities kosong (jika ada logic khusus)
    if (data?.user && data?.user?.identities?.length === 0) {
      return { message: "Email sudah terdaftar. Silakan login." };
    }

    // halaman info "cek email"
    redirect(`/activate?email=${encodeURIComponent(email)}`);
  } catch (error: any) {
    if (error?.digest?.includes("NEXT_REDIRECT")) throw error;
    console.error("Register Error:", error);
    return {
      message:
        typeof error?.message === "string"
          ? error.message
          : "Terjadi kesalahan pendaftaran.",
    };
  }
}
