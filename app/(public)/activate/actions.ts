"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type State = { message?: string; ok?: boolean };

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function resendActivationAction(
  _: State,
  formData: FormData
): Promise<State> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!isEmailValid(email)) return { message: "Email tidak valid." };

  const h = await headers();
  const origin =
    h.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const supabase = await createClient();

  const next = "/login?activated=1";
  const emailRedirectTo = `${origin}/auth/callback?type=signup&next=${encodeURIComponent(
    next
  )}&email=${encodeURIComponent(email)}`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  if (error) return { message: error.message };

  return {
    ok: true,
    message: "Email aktivasi sudah dikirim ulang. Cek inbox/spam.",
  };
}
