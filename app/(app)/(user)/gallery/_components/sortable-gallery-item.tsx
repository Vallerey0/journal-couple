"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GalleryCard, GalleryItem } from "./gallery-card";

type Props = {
  item: GalleryItem;
};

export function SortableGalleryItem({ item }: Props) {
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
    zIndex: isDragging ? 99 : "auto",
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? 1.05 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none relative"
    >
      <GalleryCard item={item} disabled />
      {isDragging && (
        <div className="absolute inset-0 border-2 border-primary rounded-2xl bg-black/10" />
      )}
    </div>
  );
}
