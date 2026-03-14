"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Camera, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ProfileItem = {
  id: string;
  name: string;
  url: string | null;
  initial: string;
  type: "male" | "female";
};

type Props = {
  items: ProfileItem[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  coupleId: string;
};

export function ProfilePhotoViewer({
  items,
  initialIndex,
  open,
  onClose,
  coupleId,
}: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // Handle back button to close preview
  useEffect(() => {
    if (open) {
      window.history.pushState({ profilePreviewOpen: true }, "");

      const onPopState = () => {
        onClose();
      };

      window.addEventListener("popstate", onPopState);

      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
  }, [open, onClose]);

  const handleClose = () => {
    if (open) {
      window.history.back();
    }
  };

  const item = items[index];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar (maks 10MB)");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya boleh upload gambar");
      return;
    }

    setLoading(true);
    try {
      // 1. Get Presigned URL
      const urlRes = await fetch(
        `/api/couple/profile-photo?contentType=${encodeURIComponent(
          file.type,
        )}&type=${item.type}`,
      );
      const json = await urlRes.json();

      if (!urlRes.ok)
        throw new Error(json.error || "Gagal mendapatkan izin upload");

      const { uploadUrl, tempKey } = json;

      // 2. Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Gagal mengunggah ke storage (R2)");

      // 3. Finalize in Server
      const finalizeRes = await fetch("/api/couple/profile-photo", {
        method: "POST",
        body: JSON.stringify({
          tempKey,
          type: item.type,
          coupleId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!finalizeRes.ok) {
        const err = await finalizeRes.json();
        throw new Error(err.error || "Gagal menyimpan foto profil");
      }

      toast.success("Foto profil berhasil diperbarui");
      router.refresh();
      handleClose();
    } catch (err: any) {
      console.error("Profile upload error:", err);
      toast.error(err.message || "Gagal memperbarui foto profil");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (loading) return;
    if (!confirm("Hapus foto profil ini?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/couple/profile-photo", {
        method: "DELETE",
        body: JSON.stringify({
          type: item.type,
          coupleId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus foto profil");
      }

      toast.success("Foto profil berhasil dihapus");
      router.refresh();
      handleClose();
    } catch (err: any) {
      console.error("Profile delete error:", err);
      toast.error(err.message || "Gagal menghapus foto profil");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm"
        >
          {/* HEADER */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 text-white bg-gradient-to-b from-black/50 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-6 w-6" />
            </Button>
            <span className="font-medium">Foto profil</span>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-[400px] aspect-square rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
              {item.url ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-8xl font-bold text-white/20">
                  {item.initial}
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="mt-12 w-full max-w-xs space-y-3">
              <label className="block w-full">
                <div className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center gap-2 text-white font-semibold transition-colors cursor-pointer">
                  <Camera className="w-5 h-5" />
                  Ganti Foto
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>

              {item.url && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold border border-red-500/20"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Hapus Foto
                </Button>
              )}

              <p className="text-center text-xs text-white/40">
                Pilih foto terbaik kamu untuk profil
              </p>
            </div>
          </div>

          {/* INDICATOR */}
          <div className="pb-8 flex justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  index === i ? "w-8 bg-white" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
