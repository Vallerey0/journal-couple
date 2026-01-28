"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type State = { message?: string; ok?: boolean };

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function forgotPasswordAction(
  _: State,
  formData: FormData,
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

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // ✅ recovery harus ke page client
    redirectTo: `${origin}/reset-password`,
  });

  if (error) return { message: error.message };

  return {
    ok: true,
    message:
      "Jika email terdaftar, kami sudah mengirim link untuk reset password. Cek inbox/spam.",
  };
}
