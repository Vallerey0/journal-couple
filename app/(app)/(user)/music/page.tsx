import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";
import MusicClient from "./music-client";

export default async function MusicPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const guard = await requireActiveSubscription();

  // 1. Fetch User Music (Library)
  const { data: musics } = await supabase
    .from("journal_music")
    .select("id, title, file_url, duration_seconds")
    .order("created_at", { ascending: false });

  // 2. Fetch Default Music (Library)
  const { data: defaultMusic } = await supabase
    .from("journal_default_music")
    .select("id, title, duration_seconds, file_url, is_premium_only")
    .eq("is_active", true)
    .order("sort_order");

  // 3. Fetch Playlist (Active Scenes)
  // We need to join manually or fetch and map because of source_type
  const { data: playlistItems } = await supabase
    .from("journal_playlists")
    .select("*")
    .order("order_index");

  // Map playlist items to actual music data
  const enrichedPlaylist = (playlistItems ?? []).map((item) => {
    let musicData = null;
    if (item.source_type === "user") {
      musicData = musics?.find((m) => m.id === item.source_id);
    } else {
      musicData = defaultMusic?.find((m) => m.id === item.source_id);
    }

    return {
      ...item,
      music: musicData
        ? {
            title: musicData.title,
            duration_seconds: musicData.duration_seconds,
            file_url: musicData.file_url,
          }
        : null,
    };
  });

  return (
    <MusicClient
      userMusic={musics ?? []}
      defaultMusic={defaultMusic ?? []}
      playlist={enrichedPlaylist}
      subscription={guard}
    />
  );
}
