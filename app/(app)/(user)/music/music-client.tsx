"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Music as MusicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlaylistManager,
  PlaylistItem,
  LibraryItem,
} from "./_components/playlist-manager";
import {
  addToPlaylistAction,
  removeFromPlaylistAction,
  reorderPlaylistAction,
  renameUserMusicAction,
} from "./actions";

// Types
type UserMusic = {
  id: string;
  title: string;
  file_url: string;
  duration_seconds: number;
};

type DefaultMusic = {
  id: string;
  title: string;
  file_url: string;
  duration_seconds: number;
  is_premium_only: boolean;
};

type Subscription =
  | { allowed: true; trial?: boolean; grace?: boolean; remainingHours?: number }
  | { allowed: false };

export default function MusicClient({
  userMusic: initialUserMusic,
  defaultMusic,
  playlist: initialPlaylist,
  subscription,
}: {
  userMusic: UserMusic[];
  defaultMusic: DefaultMusic[];
  playlist: PlaylistItem[];
  subscription: Subscription;
}) {
  const router = useRouter();

  // State
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [userMusic, setUserMusic] = useState(initialUserMusic);

  const [uploading, setUploading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync state on props change
  useEffect(() => {
    if (!uploading && !addingId && !removingId && !deletingId) {
      setPlaylist(initialPlaylist);
      setUserMusic(initialUserMusic);
    }
  }, [
    initialPlaylist,
    initialUserMusic,
    uploading,
    addingId,
    removingId,
    deletingId,
  ]);

  const isTrial = subscription.allowed && subscription.trial;
  const isGrace = subscription.allowed && subscription.grace;
  const isPremium =
    subscription.allowed && !subscription.trial && !subscription.grace;

  const maxMusic = isTrial ? 1 : isPremium ? 3 : 0;
  const canUpload = (isPremium || isTrial) && !isGrace;

  // --- ACTIONS ---

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/music", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success("Musik berhasil diupload");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gagal mengupload musik");
    } finally {
      setUploading(false);
    }
  }

  async function addToPlaylist(id: string, type: "user" | "default") {
    setAddingId(id);
    // Optimistic? Hard because we need new ID. Let's wait.
    try {
      await addToPlaylistAction(id, type);
      toast.success("Ditambahkan ke playlist");
    } catch (e: any) {
      toast.error(e.message || "Gagal menambahkan");
    } finally {
      setAddingId(null);
    }
  }

  async function removeFromPlaylist(id: string) {
    setRemovingId(id);
    const prev = [...playlist];
    setPlaylist(playlist.filter((p) => p.id !== id));

    try {
      await removeFromPlaylistAction(id);
      toast.success("Dihapus dari playlist");
    } catch (e) {
      setPlaylist(prev);
      toast.error("Gagal menghapus");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleReorderPlaylist(newItems: PlaylistItem[]) {
    setPlaylist(newItems);
    try {
      await reorderPlaylistAction(
        newItems.map((item, idx) => ({ id: item.id, sort_order: idx })),
      );
    } catch (e) {
      toast.error("Gagal menyimpan urutan");
    }
  }

  async function deleteUserMusic(id: string) {
    if (!confirm("Hapus file musik ini permanen?")) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/music/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Musik dihapus");
      router.refresh();
    } catch {
      toast.error("Gagal menghapus musik");
    } finally {
      setDeletingId(null);
    }
  }

  async function renameUserMusic(id: string, newTitle: string) {
    // Optimistic update
    setUserMusic((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title: newTitle } : m)),
    );
    try {
      await renameUserMusicAction(id, newTitle);
    } catch {
      toast.error("Gagal mengubah nama");
      router.refresh(); // Revert
    }
  }

  // Helper to check if in playlist
  const isInPlaylist = (sourceId: string, type: "user" | "default") => {
    return playlist.some(
      (p) => p.source_id === sourceId && p.source_type === type,
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ===== STATUS BANNER ===== */}
      <div className="rounded-xl border bg-card p-4 text-sm shadow-sm">
        {!subscription.allowed && (
          <p className="text-destructive font-medium">
            Langganan berakhir. Upgrade untuk upload music.
          </p>
        )}
        {isTrial && (
          <div className="flex items-center gap-2 text-amber-600">
            <MusicIcon className="w-4 h-4" />
            <p className="font-medium">Trial: {userMusic.length}/1 Upload</p>
          </div>
        )}
        {isPremium && (
          <div className="flex items-center gap-2 text-emerald-600">
            <MusicIcon className="w-4 h-4" />
            <p className="font-medium">Premium: {userMusic.length}/3 Upload</p>
          </div>
        )}
        {isGrace && (
          <p className="text-muted-foreground">
            Masa tenggang {subscription.remainingHours} jam — upload dikunci
          </p>
        )}
      </div>

      {/* ===== ACTIVE PLAYLIST (SCENE) ===== */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="font-semibold text-base">Playlist Scene</h3>
          <p className="text-xs text-muted-foreground">
            Musik ini yang akan diputar di undangan digital kamu.
          </p>
        </div>
        <PlaylistManager
          items={playlist}
          onReorder={handleReorderPlaylist}
          onRemove={removeFromPlaylist}
          removingId={removingId}
        />
      </div>

      <hr className="border-border" />

      {/* ===== LIBRARY TABS ===== */}
      <div className="space-y-3">
        <h3 className="font-semibold text-base px-1">Library Musik</h3>
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="user">Upload Saya</TabsTrigger>
            <TabsTrigger value="default">Bawaan</TabsTrigger>
          </TabsList>

          {/* USER UPLOADS */}
          <TabsContent value="user" className="space-y-4">
            {/* Upload Box */}
            <div className="relative mb-4">
              <input
                type="file"
                accept="audio/mpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={
                  !canUpload || uploading || userMusic.length >= maxMusic
                }
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                className="w-full justify-center text-muted-foreground border-dashed"
                disabled={
                  !canUpload || uploading || userMusic.length >= maxMusic
                }
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengupload...
                  </>
                ) : userMusic.length >= maxMusic ? (
                  "Batas Upload Tercapai"
                ) : (
                  "Upload MP3 Baru"
                )}
              </Button>
            </div>

            <div className="space-y-3">
              {userMusic.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Belum ada musik yang diupload.
                </p>
              ) : (
                userMusic.map((m) => {
                  const added = isInPlaylist(m.id, "user");
                  return (
                    <LibraryItem
                      key={m.id}
                      title={m.title}
                      duration={m.duration_seconds}
                      fileUrl={m.file_url}
                      isAdded={added}
                      isAdding={addingId === m.id}
                      isDeleting={deletingId === m.id}
                      onAdd={() => !added && addToPlaylist(m.id, "user")}
                      onDelete={() => deleteUserMusic(m.id)}
                      onRename={(name) => renameUserMusic(m.id, name)}
                    />
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* DEFAULT MUSIC */}
          <TabsContent value="default" className="space-y-3">
            {defaultMusic.map((m) => {
              const added = isInPlaylist(m.id, "default");
              return (
                <LibraryItem
                  key={m.id}
                  title={m.title}
                  duration={m.duration_seconds}
                  fileUrl={m.file_url}
                  isAdded={added}
                  isAdding={addingId === m.id}
                  onAdd={() => !added && addToPlaylist(m.id, "default")}
                  isPremiumOnly={m.is_premium_only}
                  canAccessPremium={isPremium}
                />
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
