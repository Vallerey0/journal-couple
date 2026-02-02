import "server-only";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

/* 
  Data fetcher khusus untuk Theme Preview.
  Memisahkan logic ini dari CRUD Couples biasa.
*/

export const getCoupleForTheme = cache(async (slug: string) => {
  const supabase = await createClient();

  // 1. Sanitasi slug
  const cleanSlug = slug.trim();

  // 2. Query ke table couples
  //    Pastikan RLS policy "couples_public_read" sudah aktif di Supabase
  const { data: couple, error } = await supabase
    .from("couples")
    .select("*")
    .eq("slug", cleanSlug)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    console.error("[getCoupleForTheme] Error:", error);
    return null;
  }

  if (!couple) return null;

  // 3. Parallel Fetch Relations (Stories, Gallery, Playlist)
  const [storiesRes, galleryRes, playlistRes] = await Promise.all([
    supabase
      .from("couple_story_phases")
      .select("*")
      .eq("couple_id", couple.id)
      .eq("is_visible", true),
    supabase
      .from("gallery_items")
      .select(
        "id, image_path, journal_title, journal_text, taken_at, is_favorite, display_order",
      )
      .eq("couple_id", couple.id)
      .eq("is_visible", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("journal_playlists")
      .select("*")
      .eq("couple_id", couple.id)
      .order("order_index", { ascending: true }),
  ]);

  const stories = storiesRes.data || [];
  const gallery = galleryRes.data || [];
  const playlistItems = playlistRes.data || [];

  // 4. Resolve Music Tracks
  let tracks: any[] = [];
  if (playlistItems.length > 0) {
    const userMusicIds = playlistItems
      .filter((p) => p.source_type === "user")
      .map((p) => p.source_id);
    const defaultMusicIds = playlistItems
      .filter((p) => p.source_type === "default")
      .map((p) => p.source_id);

    const [userMusicsRes, defaultMusicsRes] = await Promise.all([
      userMusicIds.length > 0
        ? supabase
            .from("journal_music")
            .select("id, title, file_url, duration_seconds")
            .in("id", userMusicIds)
        : { data: [] },
      defaultMusicIds.length > 0
        ? supabase
            .from("journal_default_music")
            .select("id, title, file_url, duration_seconds")
            .in("id", defaultMusicIds)
        : { data: [] },
    ]);

    const userMusics = userMusicsRes.data || [];
    const defaultMusics = defaultMusicsRes.data || [];

    tracks = playlistItems
      .map((item) => {
        if (item.source_type === "user") {
          return userMusics.find((m) => m.id === item.source_id);
        } else {
          return defaultMusics.find((m) => m.id === item.source_id);
        }
      })
      .filter(Boolean);
  }

  // 5. Return Composite Data
  return {
    ...couple,
    stories,
    gallery,
    playlist: tracks,
  };
});
