"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function toStr(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function cancelPendingIntentAction(formData: FormData) {
  const intentId = toStr(formData.get("intent_id"));
  const next = toStr(formData.get("next")) || "/home";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!intentId) redirect(`${next}?cancel=0`);

  const { data: intent } = await supabase
    .from("payment_intents")
    .select("id, user_id, status")
    .eq("id", intentId)
    .maybeSingle();

  if (!intent || intent.user_id !== user.id) {
    redirect(`${next}?cancel=0`);
  }

  // hanya boleh cancel intent pending
  if (intent.status !== "pending") {
    redirect(`${next}?cancel=1`);
  }

  const { error } = await supabase
    .from("payment_intents")
    .update({ status: "expired" })
    .eq("id", intentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Cancel intent error:", error);
    redirect(`${next}?cancel=0`);
  }

  revalidatePath("/settings");
  revalidatePath("/settings/billing");

  redirect(`${next}?cancel=1`);
}
