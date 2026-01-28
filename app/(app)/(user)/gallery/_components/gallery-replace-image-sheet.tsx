"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Props = {
  itemId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function GalleryReplaceImageSheet({
  itemId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (val: boolean) => controlledOnOpenChange?.(val)
    : setInternalOpen;

  // Cleanup preview
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
    }
  }, [open]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [file]);

  async function handleReplace() {
    if (!file || loading) return;
    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/gallery/${itemId}`, {
      method: "PUT",
      body: form,
    });

    if (!res.ok) {
      let errorMessage = "Gagal mengganti gambar";
      try {
        const json = await res.json();
        errorMessage = json.error || errorMessage;
      } catch (e) {
        console.error("Error parsing error response", e);
      }
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    setOpen(false);
    router.refresh();
    setLoading(false);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}

      <DrawerContent className="z-[10002] max-h-[96dvh] h-auto rounded-t-[10px] flex flex-col max-w-md mx-auto">
        <DrawerTitle className="sr-only">Ganti Gambar</DrawerTitle>
        <DrawerDescription className="sr-only">
          Form untuk mengganti foto kenangan
        </DrawerDescription>
        {/* Header App-like */}
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="-ml-2"
          >
            <X className="h-6 w-6" />
          </Button>
          <span className="font-semibold text-lg">Ganti Foto</span>
          <Button
            onClick={handleReplace}
            disabled={!file || loading}
            variant="ghost"
            className="text-primary font-bold -mr-2"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
          {/* Image Selector */}
          <div className="w-full">
            <label className="block w-full cursor-pointer group relative">
              <div className="relative w-full aspect-video bg-muted/50 rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center">
                {preview ? (
                  <>
                    <img
                      src={preview}
                      className="absolute inset-0 w-full h-full object-contain bg-black/5"
                      alt="Preview"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                        Ganti Foto
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-sm">Pilih foto baru</p>
                    <p className="text-xs mt-1 opacity-70">
                      Ganti dengan yang lebih baik
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;

                  // VALIDATION
                  if (f.size > 10 * 1024 * 1024) {
                    toast.warning(
                      "Ukuran file besar (>10MB). Sistem akan mengompresi otomatis, mohon tunggu sebentar saat upload.",
                    );
                    // Tidak di-return, biarkan lanjut
                  }
                  if (!f.type.startsWith("image/")) {
                    toast.error("Hanya boleh upload gambar");
                    return;
                  }

                  setFile(f);
                }}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-background">
          <Button
            onClick={handleReplace}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
