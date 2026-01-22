"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  mode: "create" | "edit";
  trigger: React.ReactNode;
  coupleId: string;
};

export function GalleryFormSheet({ mode, trigger, coupleId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleSubmit() {
    if (!file || loading) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("couple_id", coupleId);
      formData.append("journal_title", title);
      formData.append("journal_text", text);

      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Gagal mengupload gambar.");
        return;
      }

      // reset & close
      setOpen(false);
      setFile(null);
      setPreviewUrl(null);
      setTitle("");
      setText("");

      // refresh data
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* TRIGGER */}
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent
        side="bottom"
        className="
          left-1/2
          -translate-x-1/2
          w-full
          max-w-md
          max-h-[92dvh]
          rounded-t-[24px]
          p-0
          pb-[calc(env(safe-area-inset-bottom)+1rem)]
        "
      >
        {/* HEADER */}
        <div className="flex flex-col items-center w-full pt-2 pb-2">
          <div className="mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/20" />
          <SheetTitle className="pb-2 text-base font-semibold text-center">
            {mode === "create" ? "Tambah Kenangan" : "Edit Kenangan"}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Unggah foto kenanganmu
          </SheetDescription>
        </div>

        {/* CONTENT */}
        <div className="space-y-4 overflow-y-auto px-5 pb-6 max-h-[calc(92dvh-80px)]">
          {/* IMAGE PICKER + PREVIEW */}
          <label className="block cursor-pointer">
            <div className="relative w-full overflow-hidden rounded-xl bg-muted">
              {/* aspect ratio 4:5 */}
              <div className="aspect-[4/5]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center border border-dashed text-sm text-muted-foreground">
                    Pilih foto
                  </div>
                )}
              </div>

              {/* overlay ganti foto */}
              {previewUrl && (
                <div className="absolute inset-0 flex items-end justify-center bg-black/20 pb-3">
                  <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                    Ganti foto
                  </span>
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

                setFile(f);
                setPreviewUrl(URL.createObjectURL(f));
              }}
            />
          </label>

          {/* TITLE */}
          <Input
            placeholder="Judul singkat"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* TEXT */}
          <Textarea
            placeholder="Ceritakan momen ini..."
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* SUBMIT */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading ? "Menyimpan..." : "Simpan ke Gallery"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
