"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, Music } from "lucide-react";
import { createDefaultMusicAction } from "./actions";
import { useCenterToast, CenterToast } from "@/components/admin/CenterToast";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs text-muted-foreground font-medium ml-1">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 " +
        (props.className ?? "")
      }
    />
  );
}

export default function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { msg, show } = useCenterToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const file = formData.get("file") as File;

    // Validation using CenterToast (Subscription style)
    if (!title) {
      show("Judul musik wajib diisi");
      return;
    }

    if (!file || file.size === 0) {
      show("File musik wajib dipilih");
      return;
    }

    if (file.type !== "audio/mpeg") {
      show("Format file harus MP3");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      show("Ukuran file maksimal 10MB");
      return;
    }

    setIsUploading(true);

    try {
      // Use Server Action instead of API Route
      await createDefaultMusicAction(formData);

      toast.success("Music uploaded successfully");
      formRef.current?.reset();
      // Server Action revalidates path, but we can refresh to be sure
      // router.refresh(); // Not strictly needed if revalidatePath works, but good for safety
    } catch (error: any) {
      // Server errors also shown in CenterToast or Sonner?
      // User liked Subscription error handling. Subscription uses CenterToast for validation.
      // Let's use CenterToast for the error message too for consistency.
      show(error.message || "Failed to upload music");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <CenterToast message={msg} />

      <div className="flex items-center gap-2 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
          <Music className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Tambah Musik</h3>
          <p className="text-xs text-muted-foreground">Upload file MP3 baru</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
        <div className="space-y-1.5">
          <Label>Judul</Label>
          <Input
            name="title"
            placeholder="Contoh: Acoustic Morning"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Deskripsi (Opsional)</Label>
          <Input
            name="description"
            placeholder="Deskripsi singkat..."
            disabled={isUploading}
          />
        </div>

        <div className="space-y-1.5">
          <Label>File Audio</Label>
          <div className="relative group">
            <Input
              type="file"
              name="file"
              accept="audio/mpeg"
              className="file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              disabled={isUploading}
            />
          </div>
          <p className="text-[10px] text-muted-foreground ml-1">
            Format MP3. Maksimal 10MB. Durasi 5s - 10m.
          </p>
        </div>

        <div className="flex items-center gap-2 px-1 py-1">
          <input
            type="checkbox"
            name="is_premium_only"
            id="is_premium_only"
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
            disabled={isUploading}
          />
          <label
            htmlFor="is_premium_only"
            className="text-sm cursor-pointer select-none"
          >
            Premium Only
          </label>
        </div>

        <Button
          type="submit"
          disabled={isUploading}
          className="w-full rounded-xl mt-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Music
            </>
          )}
        </Button>
      </form>
    </>
  );
}
