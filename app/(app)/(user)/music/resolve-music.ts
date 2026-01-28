import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";

export type ResolvedMusic = {
  mode: "none" | "single" | "playlist";
  tracks: {
    url: string;
    duration: number;
  }[];
};

export async function resolveMusicForCouple(): Promise<ResolvedMusic> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { mode: "none", tracks: [] };

  const guard = await requireActiveSubscription();
  if (!guard.allowed) return { mode: "none", tracks: [] };

  // =====================
  // COUPLE
  // =====================
  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) return { mode: "none", tracks: [] };

  // =====================
  // FETCH PLAYLIST
  // =====================
  const { data: playlistItems } = await supabase
    .from("journal_playlists")
    .select("*")
    .eq("couple_id", couple.id)
    .order("order_index");

  if (!playlistItems || playlistItems.length === 0) {
    return { mode: "none", tracks: [] };
  }

  // =====================
  // RESOLVE TRACKS
  // =====================
  const userMusicIds = playlistItems
    .filter((p) => p.source_type === "user")
    .map((p) => p.source_id);

  const defaultMusicIds = playlistItems
    .filter((p) => p.source_type === "default")
    .map((p) => p.source_id);

  let userMusics: any[] = [];
  let defaultMusics: any[] = [];

  if (userMusicIds.length > 0) {
    const { data } = await supabase
      .from("journal_music")
      .select("id, file_url, duration_seconds")
      .in("id", userMusicIds);
    if (data) userMusics = data;
  }

  if (defaultMusicIds.length > 0) {
    const { data } = await supabase
      .from("journal_default_music")
      .select("id, file_url, duration_seconds")
      .in("id", defaultMusicIds);
    if (data) defaultMusics = data;
  }

  // Construct result preserving order
  const tracks: { url: string; duration: number }[] = [];

  for (const item of playlistItems) {
    let music = null;
    if (item.source_type === "user") {
      music = userMusics.find((m) => m.id === item.source_id);
    } else {
      music = defaultMusics.find((m) => m.id === item.source_id);
    }

    if (music) {
      tracks.push({
        url: music.file_url,
        duration: music.duration_seconds,
      });
    }
  }

  if (tracks.length === 0) return { mode: "none", tracks: [] };

  return {
    mode: tracks.length === 1 ? "single" : "playlist",
    tracks,
  };
}
