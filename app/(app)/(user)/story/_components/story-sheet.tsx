"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import {
  CalendarIcon,
  X,
  Trash2,
  Edit,
  MoreVertical,
  ChevronLeft,
  Image as ImageIcon,
} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { getPublicMediaUrl } from "@/lib/media/url";
import { toast } from "sonner";

import {
  saveStoryPhase,
  deleteStoryPhase,
  updateStoryPhaseImage,
  removeStoryPhaseImage,
  updateStoryPhaseVisibility,
} from "@/lib/stories/actions";
import { StoryData, StoryPhaseKey } from "./story-config";
import { Switch } from "@/components/ui/switch";

interface StorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseKey: StoryPhaseKey;
  title: string;
  defaultData?: StoryData | null;
  initialMode?: "preview" | "edit";
}

export function StorySheet({
  open,
  onOpenChange,
  phaseKey,
  title,
  defaultData,
  initialMode,
}: StorySheetProps) {
  // Modes: "preview" | "edit"
  // If no data, default to edit. If data exists, default to preview.
  const [mode, setMode] = useState<"preview" | "edit" | "image">(() => {
    if (initialMode) return initialMode;
    return defaultData ? "preview" : "edit";
  });
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const storageKeyBase = `story:draft:${phaseKey}`;
  const [draftContent, setDraftContent] = useState(() => {
    if (typeof window === "undefined") return defaultData?.story || "";
    const stored = window.sessionStorage.getItem(`${storageKeyBase}:content`);
    return stored ?? defaultData?.story ?? "";
  });
  const [draftDate, setDraftDate] = useState<Date | undefined>(() => {
    if (defaultData?.story_date) return new Date(defaultData.story_date);
    if (typeof window === "undefined") return undefined;
    const stored = window.sessionStorage.getItem(`${storageKeyBase}:date`);
    if (!stored) return undefined;
    const d = new Date(stored);
    return Number.isNaN(d.getTime()) ? undefined : d;
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAliveRef = useRef(true);
  const visibilityKey = `story:visibility:${phaseKey}`;
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultData?.is_visible ?? true;
    try {
      const raw = window.sessionStorage.getItem(visibilityKey);
      if (!raw) return defaultData?.is_visible ?? true;
      const parsed = JSON.parse(raw) as {
        value?: unknown;
      };
      if (typeof parsed.value === "boolean") return parsed.value;
      return defaultData?.is_visible ?? true;
    } catch {
      return defaultData?.is_visible ?? true;
    }
  });
  const [visibilitySaving, setVisibilitySaving] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.sessionStorage.getItem(visibilityKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as {
        saving?: unknown;
        startedAt?: unknown;
      };
      const saving = typeof parsed.saving === "boolean" ? parsed.saving : false;
      const startedAt =
        typeof parsed.startedAt === "number" ? parsed.startedAt : 0;
      if (!saving) return false;
      return Date.now() - startedAt < 30_000;
    } catch {
      return false;
    }
  });
  const [visibilityStartedAt, setVisibilityStartedAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = window.sessionStorage.getItem(visibilityKey);
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as { startedAt?: unknown };
      return typeof parsed.startedAt === "number" ? parsed.startedAt : 0;
    } catch {
      return 0;
    }
  });
  const [visibilityElapsedSec, setVisibilityElapsedSec] = useState(0);

  // Handle "Back" button on mobile
  useEffect(() => {
    if (open) {
      // Push state to history
      if (!window.history.state?.drawerOpen) {
        window.history.pushState(
          { drawerOpen: true },
          "",
          window.location.href,
        );
      }

      const handlePopState = (e: PopStateEvent) => {
        if (e.state?.drawerOpen) return;
        onOpenChange(false);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [open, onOpenChange]);

  useEffect(() => {
    isAliveRef.current = true;
    return () => {
      isAliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!visibilitySaving) {
      setVisibilityElapsedSec(0);
      return;
    }

    const tick = () => {
      const started = visibilityStartedAt || Date.now();
      setVisibilityElapsedSec(
        Math.max(1, Math.ceil((Date.now() - started) / 1000)),
      );
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [visibilitySaving, visibilityStartedAt]);

  function persistVisibilityState(next: {
    value: boolean;
    saving: boolean;
    startedAt: number;
  }) {
    try {
      window.sessionStorage.setItem(visibilityKey, JSON.stringify(next));
    } catch {}
  }

  async function handleToggleVisibility(next: boolean) {
    if (!defaultData) {
      toast.error("Story belum dibuat.");
      return;
    }

    if (visibilitySaving) {
      const s = visibilityElapsedSec || 1;
      toast.message(`Anda baru saja mengubah. Tunggu sebentar (${s} dtk)...`);
      return;
    }

    const prev = isVisible;
    const startedAt = Date.now();

    setIsVisible(next);
    setVisibilitySaving(true);
    setVisibilityStartedAt(startedAt);
    persistVisibilityState({ value: next, saving: true, startedAt });

    const result = await updateStoryPhaseVisibility({
      phase_key: phaseKey,
      is_visible: next,
    });

    if (!result.success) {
      persistVisibilityState({ value: prev, saving: false, startedAt: 0 });
      if (isAliveRef.current) {
        setIsVisible(prev);
        setVisibilitySaving(false);
        setVisibilityStartedAt(0);
      }
      toast.error(result.error || "Gagal mengubah visibilitas");
      return;
    }

    persistVisibilityState({ value: next, saving: false, startedAt: 0 });
    if (isAliveRef.current) {
      setVisibilitySaving(false);
      setVisibilityStartedAt(0);
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  function handlePickImage(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setImageFile(file);

    if (!file) {
      setImagePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setImagePreviewUrl(url);
  }

  const fallbackPreview = "/icon/story/how-we-met.png";
  const existingImageUrl = (() => {
    const raw = defaultData?.image_url;
    if (!raw) return null;
    if (raw.startsWith("http") || raw.startsWith("/")) return raw;
    return getPublicMediaUrl(raw);
  })();

  const hasCustomImage =
    Boolean(defaultData?.image_url) || Boolean(uploadedImageUrl);

  const displayImageUrl =
    uploadedImageUrl || imagePreviewUrl || existingImageUrl || fallbackPreview;
  const savedDate = defaultData?.story_date
    ? new Date(defaultData.story_date)
    : undefined;

  async function handleSubmit(formData: FormData) {
    if (!draftDate) {
      toast.error("Pilih tanggalnya dulu.");
      return;
    }

    setIsSubmitting(true);
    formData.set("phase_key", phaseKey);
    // Use local date string to prevent timezone shifts (toISOString converts to UTC)
    formData.set("occurred_at", format(draftDate, "yyyy-MM-dd"));

    const promise = saveStoryPhase(formData).then((result) => {
      if (!result.success) {
        throw new Error(result.error || "Gagal menyimpan cerita");
      }
      return result;
    });

    toast.promise(promise, {
      loading: "Menyimpan cerita...",
      success: () => {
        try {
          window.sessionStorage.removeItem(`${storageKeyBase}:content`);
          window.sessionStorage.removeItem(`${storageKeyBase}:date`);
        } catch {}
        // Close sheet after save or switch to preview?
        // User asked to close or behave like app. Usually save -> view.
        // Let's switch to preview if we just updated.
        // But revalidatePath might not update `defaultData` prop immediately without a refresh or parent re-render.
        // For now, let's close it as per standard save behavior, or we can stay open in preview.
        // "jika ditekan tombol kembali di hp tutup form" implies it's a transient state.
        // Let's close it to be safe and consistent with previous behavior.
        onOpenChange(false);
        return "Cerita berhasil disimpan!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.message;
      },
    });
  }

  async function handleSaveImage() {
    if (!defaultData) {
      toast.error("Buat story dulu sebelum mengubah gambar.");
      return;
    }
    if (!imageFile) {
      toast.error("Pilih gambar dulu.");
      return;
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar (maks 10MB)");
      return;
    }
    if (!imageFile.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    setIsSubmitting(true);

    try {
      const urlRes = await fetch(
        `/api/story/upload?contentType=${encodeURIComponent(imageFile.type)}`,
      );
      const json = await urlRes.json();
      if (!urlRes.ok) {
        throw new Error(json.error || "Gagal mendapatkan izin upload");
      }

      const { uploadUrl, tempKey } = json as {
        uploadUrl: string;
        tempKey: string;
      };

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: imageFile,
        headers: { "Content-Type": imageFile.type },
      });
      if (!uploadRes.ok) {
        throw new Error("Gagal mengunggah ke storage (R2)");
      }

      const fd = new FormData();
      fd.set("phase_key", phaseKey);
      fd.set("image_temp_key", tempKey);

      const result = await updateStoryPhaseImage(fd);
      if (!result.success) {
        throw new Error(result.error || "Gagal menyimpan gambar");
      }

      if (result.image_path) {
        try {
          setUploadedImageUrl(getPublicMediaUrl(result.image_path));
        } catch {
          setUploadedImageUrl(null);
        }
      }

      handlePickImage(null);
      setMode("preview");
      router.refresh();
      toast.success("Gambar story berhasil diperbarui");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan gambar";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveImage() {
    if (!defaultData) {
      toast.error("Story belum dibuat.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await removeStoryPhaseImage(phaseKey);
      if (!result.success) {
        throw new Error(result.error || "Gagal menghapus gambar");
      }

      setUploadedImageUrl(fallbackPreview);
      handlePickImage(null);
      setMode("preview");
      router.refresh();
      toast.success("Gambar dihapus");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal menghapus gambar";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsSubmitting(true);
    const promise = deleteStoryPhase(phaseKey).then((result) => {
      if (!result.success) throw new Error(result.error);
      router.refresh();
      return result;
    });

    toast.promise(promise, {
      loading: "Menghapus cerita...",
      success: () => {
        try {
          window.sessionStorage.removeItem(`${storageKeyBase}:content`);
          window.sessionStorage.removeItem(`${storageKeyBase}:date`);
        } catch {}
        onOpenChange(false);
        return "Cerita berhasil dihapus";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.message;
      },
    });
  }

  function openImageViewer() {
    if (!window.history.state?.drawerOpen) {
      window.history.pushState({ drawerOpen: true }, "", window.location.href);
    }

    if (!window.history.state?.storyImagePreview) {
      window.history.pushState(
        { drawerOpen: true, storyImagePreview: true },
        "",
        window.location.href,
      );
    }

    setImageViewerOpen(true);
  }

  useEffect(() => {
    if (!imageViewerOpen) return;

    const onPopState = (e: PopStateEvent) => {
      if (!e.state?.storyImagePreview) {
        setImageViewerOpen(false);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [imageViewerOpen]);

  function closeImageViewer() {
    if (!imageViewerOpen) return;
    if (window.history.state?.storyImagePreview) {
      window.history.back();
      return;
    }
    setImageViewerOpen(false);
  }

  const headerTitle =
    mode === "edit" ? "Edit Cerita" : mode === "image" ? "Ubah Gambar" : title;

  function submitStory() {
    if (!draftDate) {
      toast.error("Pilih tanggalnya dulu.");
      return;
    }
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        dismissible={!imageViewerOpen}
      >
        <DrawerContent className="z-[10002] max-h-[96dvh] h-auto rounded-t-[20px] flex flex-col max-w-md mx-auto bg-white/90 backdrop-blur-xl dark:bg-zinc-950/90 border-t border-white/20 shadow-2xl">
          <DrawerTitle className="sr-only">{headerTitle}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {mode === "edit" ? "Tulis ceritamu" : "Baca ceritamu"}
          </DrawerDescription>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200/50 dark:border-white/10">
            {mode !== "preview" && defaultData ? (
              <Button
                autoFocus
                variant="ghost"
                size="icon"
                onClick={() => {
                  handlePickImage(null);
                  setMode("preview");
                }}
                className="-ml-2"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                autoFocus
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="-ml-2"
              >
                <X className="h-6 w-6" />
              </Button>
            )}

            <span className="font-semibold text-lg line-clamp-1">
              {mode === "image" ? "Ubah Gambar" : title}
            </span>

            {mode === "edit" ? (
              <Button
                onClick={submitStory}
                disabled={isSubmitting}
                variant="ghost"
                className="text-primary font-bold -mr-2"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            ) : mode === "image" ? (
              <Button
                onClick={handleSaveImage}
                disabled={isSubmitting || !imageFile}
                variant="ghost"
                className="text-primary font-bold -mr-2"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2">
                    <MoreVertical className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[10005]">
                  <DropdownMenuItem onClick={() => setMode("edit")}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Cerita
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      handlePickImage(null);
                      setUploadedImageUrl(null);
                      setMode("image");
                    }}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" /> Ubah gambar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Cerita
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {mode === "preview" ? (
              <div className="space-y-4 select-none touch-manipulation">
                {defaultData && (
                  <div className="flex items-center justify-start gap-2">
                    <Switch
                      checked={isVisible}
                      onCheckedChange={handleToggleVisibility}
                    />
                    <span className="text-xs text-muted-foreground">
                      Tampilkan di preview
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {visibilitySaving
                        ? `Menyimpan... ${Math.max(1, visibilityElapsedSec)} dtk`
                        : isVisible
                          ? "Tampil"
                          : "Sembunyi"}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={openImageViewer}
                  className="mx-auto block"
                >
                  <div className="relative w-56 h-56 overflow-hidden rounded-2xl border bg-muted/20 shadow-sm">
                    <Image
                      src={displayImageUrl}
                      alt={title}
                      fill
                      sizes="224px"
                      className="object-cover"
                    />
                  </div>
                </button>

                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {savedDate
                    ? format(savedDate, "dd-MM-yyyy")
                    : "Tanggal belum diisi"}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                  {defaultData?.story || "Belum ada cerita."}
                </div>
              </div>
            ) : mode === "image" ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={openImageViewer}
                  className="mx-auto block"
                >
                  <div className="relative w-56 h-56 overflow-hidden rounded-2xl border bg-muted/20 shadow-sm">
                    <Image
                      src={displayImageUrl}
                      alt={title}
                      fill
                      sizes="224px"
                      className="object-cover"
                    />
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Pilih
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isSubmitting || !hasCustomImage}
                    onClick={handleRemoveImage}
                  >
                    Hapus
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    handlePickImage(f);
                  }}
                />
              </div>
            ) : (
              <form ref={formRef} action={handleSubmit} className="space-y-6">
                <input
                  type="hidden"
                  name="title"
                  value={defaultData?.title || title}
                />

                <div className="space-y-2">
                  <Label>Kapan kejadiannya?</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        disabled={isSubmitting}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-muted/30 border-muted-foreground/20",
                          !draftDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {draftDate ? (
                          format(draftDate, "dd-MM-yyyy")
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 z-[10003]"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={draftDate}
                        defaultMonth={draftDate}
                        onSelect={(d) => {
                          setDraftDate(d);
                          try {
                            if (d) {
                              window.sessionStorage.setItem(
                                `${storageKeyBase}:date`,
                                d.toISOString(),
                              );
                            } else {
                              window.sessionStorage.removeItem(
                                `${storageKeyBase}:date`,
                              );
                            }
                          } catch {}
                          setCalendarOpen(false);
                        }}
                        initialFocus
                        fromYear={1990}
                        toYear={new Date().getFullYear() + 5}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Ceritanya</Label>
                  <Textarea
                    id="content"
                    name="content"
                    disabled={isSubmitting}
                    placeholder="Ceritakan apa yang terjadi..."
                    className="min-h-[120px] resize-none bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20 leading-relaxed"
                    value={draftContent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftContent(val);
                      try {
                        window.sessionStorage.setItem(
                          `${storageKeyBase}:content`,
                          val,
                        );
                      } catch {}
                    }}
                    required
                  />
                </div>

                <div className="h-4" />
              </form>
            )}
          </div>

          {/* Footer for Edit Mode */}
          {mode === "edit" && (
            <div className="p-4 border-t bg-background">
              <Button
                onClick={submitStory}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Cerita"}
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {mounted &&
        imageViewerOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm pointer-events-auto"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="absolute inset-0 flex flex-col">
              <div className="relative z-10 flex items-center justify-between p-4 pointer-events-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeImageViewer}
                  className="text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="size-9" />
              </div>

              <div className="relative flex-1">
                <Image
                  src={displayImageUrl}
                  alt={title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="z-[10006]">
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Cerita ini akan dihapus permanen. Tindakan ini tidak bisa
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isSubmitting}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
