"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type CreateUserResult = {
  success?: boolean;
  error?: string;
};

export async function createUser(
  prevState: CreateUserResult | null,
  formData: FormData,
): Promise<CreateUserResult> {
  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !fullName) {
    return { error: "Email dan Nama Lengkap wajib diisi." };
  }

  const supabase = createAdminClient();

  try {
    // 1. Create auth user
    // Password random karena user akan login via magic link atau reset password nanti
    // Atau bisa kita set default password jika diminta, tapi best practice admin create adalah email confirm
    const { error: authError } = await supabase.auth.admin.createUser({
      email,
      password: crypto.randomUUID(), // Random password
      email_confirm: true, // Auto confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    // 2. Profile creation is now handled by Supabase Auth Trigger (public.handle_new_user)
    // No manual insert needed here to avoid duplicate key errors.

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan internal." };
  }
}
