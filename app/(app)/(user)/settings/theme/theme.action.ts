"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";
import { getTheme } from "@/themes/registry";
import { canUseTheme } from "@/lib/theme/access";
import { redirect } from "next/navigation";

export async function updateTheme(themeCode: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // 1. Get Theme Info
  const theme = getTheme(themeCode);
  if (!theme) {
    throw new Error("Theme not found");
  }

  // 2. Check Subscription Status
  const sub = await requireActiveSubscription();

  // 3. Validate Access
  if (!canUseTheme(theme.isPremium, sub)) {
    // Jika user mencoba bypass (misal via direct server action call),
    // redirect mereka ke halaman subscribe
    redirect("/subscribe");
  }

  // 4. Apply Update
  await supabase
    .from("couples")
    .update({ theme_code: themeCode })
    .eq("user_id", user.id); // Asumsi 1 user = 1 couple aktif

  revalidatePath("/settings/theme");
}
