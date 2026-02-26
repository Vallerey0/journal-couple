"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Check,
  Edit,
  Image as ImageIcon,
  Trash2,
  X,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { Button } from "@/components/ui/button";
import { GalleryCard, type GalleryItem } from "./gallery-card";
import { GalleryEmptyTrial } from "./gallery-empty-trial";
import { GalleryEmptyPremium } from "./gallery-empty-premium";
import { GalleryLimitTrial } from "./gallery-limit-trial";
import { GalleryViewer } from "./gallery-viewer";
import { GalleryCreateButton } from "./gallery-create-button";
import { GalleryEditSheet } from "./gallery-edit-sheet";
import { GalleryReplaceImageSheet } from "./gallery-replace-image-sheet";
import { SortableGalleryItem } from "./sortable-gallery-item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GalleryGridProps = {
  items?: GalleryItem[];
  isTrial: boolean;
  isGrace: boolean;
  limit: number;
  coupleId: string;
};

export function GalleryGrid({
  items: initialItems = [],
  isTrial,
  isGrace,
  limit,
  coupleId,
}: GalleryGridProps) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [reorderMode, setReorderMode] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<GalleryItem | null>(
    null,
  );

  // Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerKey, setViewerKey] = useState(0);

  // Long Press State
  const [longPressedId, setLongPressedId] = useState<string | null>(null);

  // Sheet States for Long Press Actions
  const [editSheetItem, setEditSheetItem] = useState<GalleryItem | null>(null);
  const [replaceSheetItem, setReplaceSheetItem] = useState<GalleryItem | null>(
    null,
  );
  const [deleteItem, setDeleteItem] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // sync saat data server berubah
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const count = items.length;

  // DND SENSORS
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Short delay to prevent accidental drags
        tolerance: 5,
      },
    }),
  );

  function handleDragStart(event: any) {
    const { active } = event;
    const item = items.find((i) => i.id === active.id);
    if (item) setActiveDragItem(item);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragItem(null);

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleDragCancel() {
    setActiveDragItem(null);
  }

  // Helper to open viewer
  function openViewer(index: number) {
    if (reorderMode) return;
    setLongPressedId(null); // Clear long press state
    setViewerIndex(index);
    setViewerKey((prev) => prev + 1); // Force new instance
    setViewerOpen(true);
  }

  async function handleSaveOrder() {
    setIsSavingOrder(true);
    try {
      const payload = {
        items: items.map((item, index) => ({
          id: item.id,
          display_order: index,
        })),
      };

      const res = await fetch("/api/gallery/reorder", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan urutan");

      toast.success("Urutan berhasil disimpan");
      setReorderMode(false);
      router.refresh();
    } catch (error) {
      toast.error("Gagal menyimpan urutan");
      console.error(error);
    } finally {
      setIsSavingOrder(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/gallery/delete?id=${deleteItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus gambar");

      toast.success("Gambar berhasil dihapus");
      setDeleteItem(null);
      setLongPressedId(null);
      router.refresh();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative pb-24">
      {/* 🔒 STICKY HEADER */}
      <div className="sticky top-0 z-20 mb-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/30 p-6 text-zinc-800 shadow-xl shadow-pink-500/5 backdrop-blur-xl dark:bg-black/30 dark:text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {count} / {limit} Momen
              </h2>
              <p className="text-xs font-medium opacity-80">
                {isTrial
                  ? "Trial Plan (Terbatas)"
                  : isGrace
                    ? "Masa Tenggang"
                    : "Premium Plan"}
              </p>
            </div>

            <div className="flex gap-2">
              {reorderMode ? (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setReorderMode(false)}
                    className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/40 text-rose-500 hover:text-rose-600 dark:bg-black/20 dark:hover:bg-black/40"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSaveOrder}
                    disabled={isSavingOrder}
                    className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-pink-500/25"
                  >
                    {isSavingOrder ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5" />
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  {!isGrace && count > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setReorderMode(true)}
                      className="h-10 w-10 rounded-full bg-white/40 hover:bg-white/60 text-zinc-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-zinc-200"
                    >
                      <ArrowLeftRight className="h-5 w-5" />
                    </Button>
                  )}

                  <GalleryCreateButton
                    isTrial={isTrial}
                    isGrace={isGrace}
                    count={count}
                    limit={limit}
                    coupleId={coupleId}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/50 dark:bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(count / limit) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {count === 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {isTrial ? (
              <GalleryEmptyTrial coupleId={coupleId} />
            ) : (
              <GalleryEmptyPremium coupleId={coupleId} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* GRID CONTENT */}
      {count > 0 && (
        <>
          {reorderMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-4">
                  {items.map((item) => (
                    <SortableGalleryItem key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeDragItem ? (
                  <div className="opacity-90 scale-105">
                    <GalleryCard item={activeDragItem} disabled />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {items.map((item, index) => (
                <div key={item.id} className="relative">
                  <GalleryCard
                    item={item}
                    disabled={isGrace}
                    onClick={() => openViewer(index)}
                    onLongPress={() => !isGrace && setLongPressedId(item.id)}
                  />

                  {/* Long Press Overlay */}
                  <AnimatePresence>
                    {longPressedId === item.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-[2px] rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-3">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-full"
                            onClick={() => {
                              setEditSheetItem(item);
                              setLongPressedId(null);
                            }}
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-full"
                            onClick={() => {
                              setReplaceSheetItem(item);
                              setLongPressedId(null);
                            }}
                          >
                            <ImageIcon className="h-5 w-5" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-10 w-10 rounded-full"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-8 w-8 text-white/70 hover:text-white"
                          onClick={() => setLongPressedId(null)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* LIMIT WARNING */}
      {isTrial && count >= limit && !isGrace && (
        <div className="mt-8">
          <GalleryLimitTrial />
        </div>
      )}

      {/* VIEWER */}
      <GalleryViewer
        key={viewerKey}
        items={items}
        initialIndex={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        coupleId={coupleId}
      />

      {/* SHEETS & DIALOGS */}
      {editSheetItem && (
        <GalleryEditSheet
          itemId={editSheetItem.id}
          initialTitle={editSheetItem.journal_title}
          initialText={editSheetItem.journal_text}
          initialTakenAt={editSheetItem.taken_at}
          initialIsFavorite={editSheetItem.is_favorite}
          initialMemoryType={editSheetItem.memory_type}
          imageUrl={editSheetItem.image_url}
          open={!!editSheetItem}
          onOpenChange={(open) => !open && setEditSheetItem(null)}
        />
      )}

      {replaceSheetItem && (
        <GalleryReplaceImageSheet
          itemId={replaceSheetItem.id}
          open={!!replaceSheetItem}
          onOpenChange={(open) => !open && setReplaceSheetItem(null)}
        />
      )}

      <Dialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kenangan?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Gambar dan cerita akan
              dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteItem(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
