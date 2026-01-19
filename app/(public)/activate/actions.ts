"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type State = { message?: string; ok?: boolean };

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function mapAuthErrorToMessage(raw: string) {
  const msg = raw.toLowerCase();
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Terlalu sering. Coba lagi sebentar.";
  }
  return raw;
}

export async function resendActivationAction(
  _: State,
  formData: FormData
): Promise<State> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!isEmailValid(email)) return { message: "Email tidak valid." };

  const origin = await getOriginFromHeaders();
  const supabase = await createClient();

  // ✅ sama: hanya /auth/confirm
  const emailRedirectTo = `${origin}/auth/confirm`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  if (error) return { message: mapAuthErrorToMessage(error.message) };

  return {
    ok: true,
    message: "Email aktivasi sudah dikirim ulang. Cek inbox/spam.",
  };
}
