"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";

/* =====================================================
   INTERNAL GUARD
   ===================================================== */
async function guardSubscription() {
  const result = await requireActiveSubscription();
  if (!result.allowed) {
    redirect("/subscribe");
  }
}

/* =====================================================
   UPDATE GALLERY ITEM (METADATA ONLY)
   ===================================================== */
export async function updateGalleryItem(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await guardSubscription();

  const itemId = formData.get("item_id") as string | null;
  const journalTitle = formData.get("journal_title") as string | null;
  const journalText = formData.get("journal_text") as string | null;

  if (!itemId) return { error: "ID item tidak ditemukan" };

  const { error } = await supabase
    .from("gallery_items")
    .update({
      journal_title: journalTitle,
      journal_text: journalText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  revalidatePath("/gallery");
  return { success: true };
}

/* =====================================================
   DELETE GALLERY ITEM (DB ONLY)
   ===================================================== */
export async function deleteGalleryItem(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await guardSubscription();

  const itemId = formData.get("item_id") as string | null;
  if (!itemId) return { error: "ID item tidak ditemukan" };

  const { error } = await supabase
    .from("gallery_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  revalidatePath("/gallery");
  return { success: true };
}
