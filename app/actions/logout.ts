"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
  const supabase = await createClient();

  // hapus session Supabase (cookie)
  await supabase.auth.signOut();

  // selalu balik ke login user
  redirect("/login");
}
