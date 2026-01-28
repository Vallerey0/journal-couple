import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import UploadForm from "./upload-form";
import DraggableMusicList from "./draggable-music-list";

export default async function AdminDefaultMusicPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("journal_default_music")
    .select(
      "id, title, description, duration_seconds, is_premium_only, is_active, file_url, sort_order",
    )
    .order("sort_order", { ascending: true });

  const musics = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Default Music</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Musik bawaan sistem untuk Trial & Premium. Dikelola oleh admin.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* CREATE */}
        <Card className="p-6 lg:col-span-4 sticky top-6">
          <UploadForm />
        </Card>

        {/* LIST */}
        <Card className="p-6 lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Music Library</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {musics.length} items
            </span>
          </div>

          <DraggableMusicList initialItems={musics} />
        </Card>
      </div>
    </div>
  );
}
