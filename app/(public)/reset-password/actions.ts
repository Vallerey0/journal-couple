"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type State = { message?: string };

export async function resetPasswordAction(
  _: State,
  formData: FormData
): Promise<State> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm_password") || "");

  if (password.length < 8) return { message: "Password minimal 8 karakter." };
  if (password !== confirm)
    return { message: "Konfirmasi password tidak sama." };

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password }); // updateUser dipakai setelah recovery :contentReference[oaicite:4]{index=4}
  if (error) return { message: error.message };

  redirect("/login?reset=1");
}
