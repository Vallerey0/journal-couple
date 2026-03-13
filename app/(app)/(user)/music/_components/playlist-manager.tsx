"use client";

import { useState, useId, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Loader2,
  Trash2,
  Check,
  Plus,
  Play,
  Pause,
  Pencil,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// --- Types ---
export type PlaylistItem = {
  id: string; // playlist id
  source_id: string;
  source_type: "user" | "default";
  order_index: number;
  music: {
    title: string;
    duration_seconds: number;
    file_url: string;
  } | null;
};

// --- Helper: Format Duration ---
function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// --- Component: Mini Player ---
function MiniPlayer({
  url,
  initialDuration,
}: {
  url: string;
  initialDuration: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [mountedAudio, setMountedAudio] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || initialDuration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [initialDuration, mountedAudio]);

  // Handle Play/Pause
  const togglePlay = () => {
    // Lazy-mount audio element on first interaction to avoid heavy preload
    if (!mountedAudio) {
      setMountedAudio(true);
      // Wait next tick for audio to mount then play
      setTimeout(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const allAudios = document.querySelectorAll("audio");
        allAudios.forEach((a) => {
          if (a !== audio) a.pause();
        });
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.error("Play error:", e);
            setIsPlaying(false);
          });
      }, 0);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const allAudios = document.querySelectorAll("audio");
      allAudios.forEach((a) => {
        if (a !== audio) a.pause();
      });
      audio.play().catch((e) => {
        console.error("Play error:", e);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  // Listen to external pause (e.g. from other players)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPause = () => setIsPlaying(false);
    audio.addEventListener("pause", onPause);
    return () => audio.removeEventListener("pause", onPause);
  }, [mountedAudio]);

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="w-full space-y-2 mt-2">
      {mountedAudio ? <audio ref={audioRef} src={url} preload="none" /> : null}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full shrink-0 bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:hover:bg-pink-900/50 transition-colors"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        {/* Progress Bar & Time */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 accent-pink-500 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>{fmtDuration(currentTime)}</span>
            <span>{fmtDuration(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sortable Playlist Item ---
function SortablePlaylistItem({
  item,
  onRemove,
  removingId,
}: {
  item: PlaylistItem;
  onRemove: (id: string) => void;
  removingId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: isDragging ? "relative" : ("static" as any),
  };

  const isRemoving = removingId === item.id;

  if (!item.music) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex flex-col rounded-2xl border p-4 transition-all select-none ${
        isDragging
          ? "bg-white shadow-2xl ring-2 ring-pink-500 scale-[1.02] dark:bg-zinc-900 z-50 opacity-90"
          : "bg-white/60 border-white/20 hover:bg-white/80 dark:bg-zinc-900/60 dark:border-white/10 dark:hover:bg-zinc-900/80"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Visual Indicator - Handle still here for cue */}
          <div className="text-muted-foreground/40 group-hover:text-pink-500/60 p-1 -ml-1 transition-colors touch-none">
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold truncate text-sm text-foreground">
                {item.music.title}
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-widest ${
                  item.source_type === "user"
                    ? "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800"
                    : "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                }`}
              >
                {item.source_type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{fmtDuration(item.music.duration_seconds)}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-[10px] opacity-60">
                Tekan lama untuk geser
              </span>
            </div>
          </div>
        </div>

        <div onPointerDown={(e) => e.stopPropagation()}>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 hover:bg-destructive/10 rounded-full transition-colors"
            onClick={() => onRemove(item.id)}
            disabled={!!removingId}
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Player Section - Prevent drag when interacting with player */}
      <div
        className="pt-3 border-t border-white/10 mt-3"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MiniPlayer
          url={item.music.file_url}
          initialDuration={item.music.duration_seconds}
        />
      </div>
    </div>
  );
}

// --- Main Playlist Component ---
export function PlaylistManager({
  items,
  onReorder,
  onRemove,
  removingId,
}: {
  items: PlaylistItem[];
  onReorder: (items: PlaylistItem[]) => void;
  onRemove: (id: string) => void;
  removingId: string | null;
}) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/20 dark:bg-zinc-900/20">
        <p className="text-sm text-muted-foreground">
          Playlist kosong. Tambahkan musik dari library di bawah.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {items.map((item) => (
            <SortablePlaylistItem
              key={item.id}
              item={item}
              onRemove={onRemove}
              removingId={removingId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// --- User Library Item ---
export function LibraryItem({
  title,
  duration,
  fileUrl,
  onAdd,
  onDelete, // Optional: only for user music
  onRename, // Optional: only for user music
  isAdded,
  isAdding,
  isDeleting,
  isPremiumOnly = false,
  canAccessPremium = false,
}: {
  title: string;
  duration: number;
  fileUrl: string;
  onAdd: () => void;
  onDelete?: () => void;
  onRename?: (newTitle: string) => Promise<void>;
  isAdded: boolean;
  isAdding: boolean;
  isDeleting?: boolean;
  isPremiumOnly?: boolean;
  canAccessPremium?: boolean;
}) {
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(title);
  const [isRenaming, setIsRenaming] = useState(false);

  const isLocked = isPremiumOnly && !canAccessPremium;

  async function handleRenameSubmit() {
    if (!onRename) return;
    setIsRenaming(true);
    try {
      await onRename(newName);
      setShowRename(false);
      toast.success("Nama berhasil diubah");
    } catch (e) {
      toast.error("Gagal mengubah nama");
    } finally {
      setIsRenaming(false);
    }
  }

  return (
    <>
      <div className="group flex flex-col rounded-xl border border-white/20 bg-white/60 p-3 transition-all hover:bg-white/80 dark:bg-zinc-900/60 dark:border-white/10 dark:hover:bg-zinc-900/80 shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate text-sm text-foreground">
                  {title}
                </span>
                {isPremiumOnly && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] font-bold uppercase border border-amber-200 dark:border-amber-800 tracking-wider">
                    <Lock className="w-2.5 h-2.5" /> Premium
                  </span>
                )}
                {onRename && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                    onClick={() => setShowRename(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {fmtDuration(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
                onClick={onDelete}
                disabled={isDeleting || isAdding}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}

            <Button
              size="sm"
              variant={isAdded ? "secondary" : isLocked ? "outline" : "default"}
              className={`h-8 text-xs gap-1 px-3 rounded-lg shadow-sm transition-all ${
                isAdded
                  ? "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  : isLocked
                    ? "opacity-70 cursor-not-allowed border-dashed"
                    : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/20"
              }`}
              onClick={isLocked ? undefined : onAdd}
              disabled={isAdded || isAdding || isDeleting || isLocked}
            >
              {isAdding ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isAdded ? (
                <>
                  <Check className="w-3 h-3" /> Added
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-3 h-3" /> Locked
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" /> Add
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Player Section */}
        <div className="pt-2 border-t border-white/10 mt-2">
          <MiniPlayer url={fileUrl} initialDuration={duration} />
        </div>
      </div>

      {/* Rename Dialog */}
      {onRename && (
        <Dialog open={showRename} onOpenChange={setShowRename}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ganti Nama Musik</DialogTitle>
              <DialogDescription>
                Masukkan nama baru untuk musik ini.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama
                </Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleRenameSubmit}
                disabled={isRenaming || !newName.trim()}
              >
                {isRenaming && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
