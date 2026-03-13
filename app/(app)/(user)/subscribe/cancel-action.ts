"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function cancelPendingIntentAction(formData: FormData) {
  const intentId = formData.get("intent_id") as string;
  const nextPath = (formData.get("next") as string) || "/subscribe";

  if (!intentId) return;

  const admin = createAdminClient();

  await admin
    .from("payment_intents")
    .update({
      status: "expired",
      processed_at: new Date().toISOString(),
    })
    .eq("id", intentId)
    .eq("status", "pending");

  revalidatePath(nextPath);
}
