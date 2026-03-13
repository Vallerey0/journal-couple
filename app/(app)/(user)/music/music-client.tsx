"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Music as MusicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const tabsId = useId();
  const [mounted, setMounted] = useState(false);

  // State
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [userMusic, setUserMusic] = useState(initialUserMusic);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    // Check limits again before starting
    if (userMusic.length >= maxMusic) {
      if (isTrial) {
        toast.error(
          "Slot upload Trial sudah penuh (maks 1). Silakan upgrade ke Premium untuk menambah lebih banyak musik!",
        );
      } else {
        toast.error(
          `Slot upload Premium sudah penuh (maks ${maxMusic}). Hapus musik lama untuk mengganti dengan yang baru.`,
        );
      }
      return;
    }

    setUploading(true);
    setUploadProgress("Preparing upload...");

    try {
      // 1. Get Presigned URL
      const urlRes = await fetch("/api/music");
      const { uploadUrl, tempKey, error: urlError } = await urlRes.json();
      if (!urlRes.ok)
        throw new Error(urlError ?? "Gagal mendapatkan izin upload");

      // 2. Upload directly to R2
      setUploadProgress("Uploading to storage...");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Gagal mengunggah file ke storage");
      }

      // 3. Finalize in Server
      setUploadProgress("Finalizing...");
      const fd = new FormData();
      fd.append("tempKey", tempKey);
      fd.append("fileName", file.name);

      const res = await fetch("/api/music", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      toast.success("Musik berhasil diupload");
      router.refresh();
    } catch (e: any) {
      console.error("Music upload error:", e);
      toast.error(
        "Gagal mengunggah musik. Pastikan koneksi internet stabil dan coba lagi.",
      );
    } finally {
      setUploading(false);
      setUploadProgress("");
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

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function deleteUserMusic(id: string) {
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
      setDeleteConfirmId(null);
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
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden pb-24">
      {/* BACKGROUND BLOBS - Static for performance */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-0 max-w-xl mx-auto space-y-8 pt-6">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-2xl sm:text-3xl font-bold text-transparent">
            Music Library
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Atur musik latar untuk priview kalian agar lebih berkesan.
          </p>
        </div>

        {/* ===== STATUS BANNER ===== */}
        <div className="rounded-2xl border border-white/20 bg-white/40 p-5 shadow-lg shadow-purple-500/5 dark:border-white/10 dark:bg-zinc-900/40">
          {!subscription.allowed && (
            <p className="text-destructive font-medium flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              Langganan berakhir. Upgrade untuk upload music.
            </p>
          )}
          {isTrial && (
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <MusicIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-sm">Mode Trial</p>
                <p className="text-xs opacity-80">
                  {userMusic.length}/1 Slot Upload Terpakai
                </p>
              </div>
            </div>
          )}
          {isPremium && (
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <MusicIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-sm">Mode Premium</p>
                <p className="text-xs opacity-80">
                  {userMusic.length}/3 Slot Upload Terpakai
                </p>
              </div>
            </div>
          )}
          {isGrace && (
            <p className="text-muted-foreground text-sm mt-2 pt-2 border-t border-dashed border-border/50">
              Masa tenggang {subscription.remainingHours} jam — upload dikunci
              sementara.
            </p>
          )}
        </div>

        {/* ===== ACTIVE PLAYLIST (SCENE) ===== */}
        <div className="space-y-4">
          <div className="px-1 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-foreground">
                Playlist Scene
              </h3>
              <p className="text-xs text-muted-foreground">
                Urutan musik yang diputar di undangan.
              </p>
            </div>
          </div>
          <PlaylistManager
            items={playlist}
            onReorder={handleReorderPlaylist}
            onRemove={removeFromPlaylist}
            removingId={removingId}
          />
        </div>

        {/* ===== LIBRARY TABS ===== */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg px-1 text-foreground">
            Koleksi Musik
          </h3>
          {mounted ? (
            <Tabs id={tabsId} defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl border border-white/20">
                <TabsTrigger
                  value="user"
                  className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-700 dark:data-[state=active]:text-pink-400 transition-all duration-300"
                >
                  Upload Saya
                </TabsTrigger>
                <TabsTrigger
                  value="default"
                  className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-700 dark:data-[state=active]:text-purple-400 transition-all duration-300"
                >
                  Galeri Bawaan
                </TabsTrigger>
              </TabsList>

              {/* USER UPLOADS */}
              <TabsContent
                value="user"
                className="space-y-6 focus-visible:outline-none"
              >
                {/* Upload Box */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl opacity-10 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 transition-colors hover:bg-white/80 dark:hover:bg-zinc-900/80">
                    <input
                      type="file"
                      accept="audio/mpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      onClick={(e) => {
                        if (userMusic.length >= maxMusic) {
                          e.preventDefault();
                          if (isTrial) {
                            toast.error(
                              "Slot upload Trial sudah penuh (maks 1). Silakan upgrade ke Premium untuk menambah lebih banyak musik!",
                            );
                          } else {
                            toast.error(
                              `Slot upload Premium sudah penuh (maks ${maxMusic}). Hapus musik lama untuk mengganti dengan yang baru.`,
                            );
                          }
                        }
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) upload(file);
                      }}
                      disabled={uploading || !canUpload}
                    />
                    <div className="h-12 w-12 rounded-full bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mb-3">
                      {uploading ? (
                        <Loader2 className="h-6 w-6 text-pink-500 animate-spin" />
                      ) : (
                        <MusicIcon className="h-6 w-6 text-pink-500" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">
                        {uploading ? uploadProgress : "Pilih musik (MP3)"}
                      </p>
                      <p className="text-[10px] mt-1 opacity-70">
                        Maks 10MB. Durasi 5 detik - 10 menit.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Music List */}
                <div className="space-y-3">
                  {userMusic.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
                      <p className="text-sm text-muted-foreground">
                        Belum ada musik yang diupload.
                      </p>
                    </div>
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
                          onDelete={() => setDeleteConfirmId(m.id)}
                          onRename={(name) => renameUserMusic(m.id, name)}
                        />
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* DEFAULT MUSIC */}
              <TabsContent
                value="default"
                className="space-y-3 focus-visible:outline-none"
              >
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
          ) : (
            <div className="h-[400px] w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent className="rounded-3xl border-pink-100 dark:border-pink-900/30 backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 z-[10001] shadow-2xl shadow-pink-500/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Hapus Musik?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400">
              Tindakan ini tidak dapat dibatalkan. File musik akan dihapus
              permanen dari library Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6">
            <AlertDialogCancel className="rounded-2xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirmId && deleteUserMusic(deleteConfirmId)
              }
              className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 border-none transition-all active:scale-95"
            >
              Hapus Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
