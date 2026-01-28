"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

type Props = {
  trigger: React.ReactNode;
  coupleId: string;
};

export function GalleryCreateSheet({ trigger, coupleId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [memoryType, setMemoryType] = useState("");
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function submit() {
    if (!file || loading) return;

    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("couple_id", coupleId);
      form.append("journal_title", title);
      form.append("journal_text", text);
      if (date) form.append("taken_at", format(date, "yyyy-MM-dd"));
      form.append("is_favorite", String(isFavorite));
      form.append("memory_type", memoryType);

      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let errorMessage = "Unknown error";
        try {
          const err = await res.json();
          errorMessage = err.error || errorMessage;
        } catch (e) {
          errorMessage = `Server Error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setOpen(false);
      setFile(null);
      setPreviewUrl(null);
      setTitle("");
      setText("");
      setDate(undefined);
      setIsFavorite(false);
      setMemoryType("");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gagal upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent className="z-[10002] max-h-[96dvh] h-auto rounded-t-[10px] flex flex-col max-w-md mx-auto">
        <DrawerTitle className="sr-only">Tambah Kenangan</DrawerTitle>
        <DrawerDescription className="sr-only">
          Form untuk menambahkan foto kenangan baru
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
          <span className="font-semibold text-lg">Postingan Baru</span>
          <Button
            onClick={submit}
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
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
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
                      <ImagePlus className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-sm">
                      Pilih foto dari galeri
                    </p>
                    <p className="text-xs mt-1 opacity-70">
                      Format JPG, PNG, atau WebP
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
                  setPreviewUrl(URL.createObjectURL(f));
                }}
              />
            </label>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                placeholder="Berikan judul singkat..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Cerita (Opsional)</Label>
              <Textarea
                id="text"
                placeholder="Tulis sesuatu tentang foto ini..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Kenangan</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted/30 border-muted-foreground/20",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-[10003]"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      defaultMonth={date}
                      onSelect={(date) => {
                        setDate(date);
                        setCalendarOpen(false);
                      }}
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memory_type">Tipe Kenangan</Label>
                <Input
                  id="memory_type"
                  placeholder="Misal: Liburan"
                  value={memoryType}
                  onChange={(e) => setMemoryType(e.target.value)}
                  className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/30 border-muted-foreground/20">
              <Switch
                id="favorite"
                checked={isFavorite}
                onCheckedChange={setIsFavorite}
              />
              <Label htmlFor="favorite" className="cursor-pointer">
                Jadikan Favorit ❤️
              </Label>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-background">
          <Button
            onClick={submit}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
