"use client";

import { useState, useEffect, useId } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { MoreVertical, Play, Pause, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  deleteDefaultMusicAction,
  reorderDefaultMusicAction,
  toggleDefaultMusicActiveAction,
  updateDefaultMusicAction,
} from "./actions";

// --- Types ---
type MusicItem = {
  id: string;
  title: string;
  description: string | null;
  duration_seconds: number;
  is_premium_only: boolean;
  is_active: boolean;
  file_url: string;
  sort_order: number;
};

// --- Sortable Item Component ---
function SortableMusicItem({
  item,
  isPlaying,
  currentTime,
  onPlayToggle,
  onEdit,
  onDelete,
}: {
  item: MusicItem;
  isPlaying: boolean;
  currentTime: number;
  onPlayToggle: () => void;
  onEdit: (item: MusicItem) => void;
  onDelete: (id: string) => void;
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

  function fmtDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // Handle active toggle
  const handleToggleActive = async () => {
    const formData = new FormData();
    formData.append("id", item.id);
    formData.append("next_active", item.is_active ? "0" : "1");

    try {
      await toggleDefaultMusicActiveAction(formData);
      toast.success(item.is_active ? "Music disabled" : "Music enabled");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const progressPercent =
    isPlaying && item.duration_seconds > 0
      ? (currentTime / item.duration_seconds) * 100
      : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border p-3 bg-card hover:bg-accent/50 transition-colors relative overflow-hidden ${
        isDragging ? "shadow-lg ring-2 ring-primary opacity-90" : ""
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground p-1 z-10"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Play Button */}
      <Button
        variant="secondary"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full z-10"
        onClick={onPlayToggle}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </Button>

      {/* Info */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm truncate">{item.title}</h4>
          {item.is_premium_only && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase">
              Premium
            </span>
          )}
          {!item.is_active && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold uppercase">
              Disabled
            </span>
          )}
        </div>

        {isPlaying ? (
          <div className="flex items-center gap-3 mt-1.5 w-full max-w-md">
            <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200 ease-linear rounded-full"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-primary tabular-nums shrink-0">
              {fmtDuration(currentTime)} / {fmtDuration(item.duration_seconds)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{fmtDuration(item.duration_seconds)}</span>
            <span>•</span>
            <span className="truncate max-w-[200px]">
              {item.description || "No description"}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 z-10">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleToggleActive}>
            {item.is_active ? "Disable" : "Enable"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(item)}>
            Edit Metadata
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// --- Main List Component ---
export default function DraggableMusicList({
  initialItems,
}: {
  initialItems: MusicItem[];
}) {
  const dndId = useId();
  const [items, setItems] = useState(initialItems);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Edit & Delete State
  const [editingItem, setEditingItem] = useState<MusicItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Sync initialItems (fix for list not updating after upload)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Audio Player Logic
  useEffect(() => {
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => {
        setPlayingId(null);
        setCurrentTime(0);
      };

      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, [audio]);

  const togglePlay = (item: MusicItem) => {
    if (playingId === item.id) {
      audio?.pause();
      setPlayingId(null);
    } else {
      if (audio) {
        audio.pause();
      }
      const newAudio = new Audio(item.file_url);
      newAudio.play().catch((e) => toast.error("Failed to play audio"));
      setAudio(newAudio);
      setPlayingId(item.id);
    }
  };

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  // DnD Handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);

    // Optimistic update
    setItems(newItems);

    const updates = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    // Trigger server action in background
    try {
      await reorderDefaultMusicAction(updates);
    } catch (e) {
      toast.error("Failed to save order");
    }
  };

  // Delete Handler
  const confirmDelete = async () => {
    if (!deletingId) return;

    const formData = new FormData();
    formData.append("id", deletingId);

    const promise = deleteDefaultMusicAction(formData);

    toast.promise(promise, {
      loading: "Deleting music...",
      success: "Music deleted successfully",
      error: (err) => err.message || "Failed to delete music",
    });

    try {
      await promise;
      setItems(items.filter((i) => i.id !== deletingId));
    } catch (e) {
      // Error handled by toast
    } finally {
      setDeletingId(null);
    }
  };

  // Edit Handler
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsEditSaving(true);

    const formData = new FormData(e.currentTarget);
    const promise = updateDefaultMusicAction(formData);

    toast.promise(promise, {
      loading: "Updating metadata...",
      success: "Music updated",
      error: (err) => err.message || "Failed to update",
    });

    try {
      await promise;
      // We rely on server revalidation and the useEffect(initialItems) hook to update the list properly
      // But we can do partial optimistic update if needed.
      // Since we might change the file (and duration), it's better to wait for revalidation or just close the dialog.
      // The list will update automatically because of revalidatePath in action -> page re-renders -> initialItems updates -> useEffect updates items.
      setEditingItem(null);
    } catch (e) {
      // handled by toast
    } finally {
      setIsEditSaving(false);
    }
  };

  return (
    <>
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
              <SortableMusicItem
                key={item.id}
                item={item}
                isPlaying={playingId === item.id}
                currentTime={playingId === item.id ? currentTime : 0}
                onPlayToggle={() => togglePlay(item)}
                onEdit={setEditingItem}
                onDelete={setDeletingId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Delete Alert */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              music file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(o) => !o && setEditingItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Music</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="hidden" name="id" value={editingItem.id} />
              <div className="space-y-2">
                <Label>Title</Label>
                <Input name="title" defaultValue={editingItem.title} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  defaultValue={editingItem.description || ""}
                />
              </div>

              <div className="space-y-2">
                <Label>Ganti File Audio (Opsional)</Label>
                <Input
                  type="file"
                  name="file"
                  accept="audio/mpeg"
                  className="file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                <p className="text-[10px] text-muted-foreground">
                  Upload untuk mengganti file lama. Format MP3 (5s - 10m).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_premium_only"
                  id="edit_premium"
                  defaultChecked={editingItem.is_premium_only}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="edit_premium" className="cursor-pointer mb-0">
                  Premium Only
                </Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isEditSaving}>
                  {isEditSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
