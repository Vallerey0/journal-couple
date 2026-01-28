"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar as CalendarIcon } from "lucide-react";
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
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

type Props = {
  itemId: string;
  initialTitle: string | null;
  initialText: string | null;
  initialTakenAt?: string | null;
  initialIsFavorite?: boolean;
  initialMemoryType?: string | null;
  imageUrl?: string | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function GalleryEditSheet({
  itemId,
  initialTitle,
  initialText,
  initialTakenAt,
  initialIsFavorite,
  initialMemoryType,
  imageUrl,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [text, setText] = useState(initialText ?? "");
  const [date, setDate] = useState<Date | undefined>(
    initialTakenAt ? new Date(initialTakenAt) : undefined,
  );
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite ?? false);
  const [memoryType, setMemoryType] = useState(initialMemoryType ?? "");
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (val: boolean) => controlledOnOpenChange?.(val)
    : setInternalOpen;

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setTitle(initialTitle ?? "");
      setText(initialText ?? "");
      setDate(initialTakenAt ? new Date(initialTakenAt) : undefined);
      setIsFavorite(initialIsFavorite ?? false);
      setMemoryType(initialMemoryType ?? "");
    }
  }, [
    open,
    initialTitle,
    initialText,
    initialTakenAt,
    initialIsFavorite,
    initialMemoryType,
  ]);

  async function handleSave() {
    if (loading) return;
    setLoading(true);

    const res = await fetch(`/api/gallery/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journal_title: title,
        journal_text: text,
        taken_at: date ? format(date, "yyyy-MM-dd") : null,
        is_favorite: isFavorite,
        memory_type: memoryType || null,
      }),
    });

    if (!res.ok) {
      let errorMessage = "Unknown error";
      try {
        const err = await res.json();
        console.error("Edit Failed JSON:", err);
        errorMessage = err.error || errorMessage;
      } catch (e) {
        console.error("Edit Failed (Non-JSON):", res.status, res.statusText);
        errorMessage = `Server Error: ${res.status} ${res.statusText}`;
      }

      toast.error(`Gagal menyimpan perubahan: ${errorMessage}`);
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
        <DrawerTitle className="sr-only">Edit Kenangan</DrawerTitle>
        <DrawerDescription className="sr-only">
          Form untuk mengubah detail kenangan foto
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
          <span className="font-semibold text-lg">Edit Info</span>
          <Button
            onClick={handleSave}
            disabled={loading}
            variant="ghost"
            className="text-primary font-bold -mr-2"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
          {/* Image Preview removed by user request */}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Momen</Label>
              <Input
                placeholder="Beri judul..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cerita di balik ini</Label>
              <Textarea
                placeholder="Tulis sesuatu tentang foto ini..."
                className="min-h-[120px] resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
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
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, "dd-MM-yyyy")
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-[10003]"
                    align="center"
                    sideOffset={4}
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
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-lg">
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

        {/* Footer (Alternative Save Button) */}
        <div className="p-4 border-t bg-background">
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
