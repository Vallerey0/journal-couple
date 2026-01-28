"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";

// --- PLAYLIST MANAGEMENT ---

export async function addToPlaylistAction(
  sourceId: string,
  sourceType: "user" | "default",
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const guard = await requireActiveSubscription();
  if (!guard.allowed) throw new Error("Subscription required");

  // Get Couple
  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!couple) throw new Error("Couple not found");

  // Check Duplicate
  const { data: exists } = await supabase
    .from("journal_playlists")
    .select("id")
    .eq("couple_id", couple.id)
    .eq("source_id", sourceId)
    .eq("source_type", sourceType)
    .maybeSingle();

  if (exists) throw new Error("Music already in playlist");

  // Get current max order
  const { data: maxOrder } = await supabase
    .from("journal_playlists")
    .select("order_index")
    .eq("couple_id", couple.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newOrder = (maxOrder?.order_index ?? -1) + 1;

  // Insert
  const { error } = await supabase.from("journal_playlists").insert({
    couple_id: couple.id,
    source_id: sourceId,
    source_type: sourceType,
    order_index: newOrder,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/music");
}

export async function removeFromPlaylistAction(playlistId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("journal_playlists")
    .delete()
    .eq("id", playlistId);

  if (error) throw new Error(error.message);

  revalidatePath("/music");
}

export async function reorderPlaylistAction(
  items: { id: string; sort_order: number }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  for (const item of items) {
    await supabase
      .from("journal_playlists")
      .update({ order_index: item.sort_order })
      .eq("id", item.id);
  }

  revalidatePath("/music");
}

// --- USER MUSIC MANAGEMENT ---

export async function renameUserMusicAction(musicId: string, newTitle: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (!newTitle.trim()) throw new Error("Title cannot be empty");

  const { error } = await supabase
    .from("journal_music")
    .update({ title: newTitle.trim() })
    .eq("id", musicId);

  if (error) throw new Error(error.message);

  revalidatePath("/music");
}

// NOTE: addDefaultMusicToLibrary is removed/deprecated if we use direct playlist referencing.
// If user still wants to "import" default music to their library (to rename it?), we can keep it.
// But the prompt implies adding directly to playlist from default list.
// "tambahkan fitur untuk menambahkan music dari user dan default ke daftar playlist"
