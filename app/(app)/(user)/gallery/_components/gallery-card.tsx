"use client";

import Image from "next/image";
import { motion, PanInfo } from "framer-motion";
import { useRef } from "react";

export type GalleryItem = {
  id: string;
  image_url: string | null;
  thumbnail_url?: string | null;
  journal_title: string | null;
  journal_text: string | null;
  display_order?: number;
  taken_at?: string | null;
  is_favorite?: boolean;
  memory_type?: string | null;
};

export type GalleryCardProps = {
  item: GalleryItem;
  disabled?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
};

export function GalleryCard({
  item,
  disabled = false,
  onClick,
  onLongPress,
}: GalleryCardProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  function handleStart() {
    if (disabled) return;
    isLongPress.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (onLongPress) {
        onLongPress();
      }
    }, 500); // 500ms for long press
  }

  function handleEnd() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function handleTap() {
    handleEnd();
    if (disabled) return;
    // If it was a long press, do nothing (onLongPress already fired)
    // If NOT a long press, trigger onClick
    if (!isLongPress.current) {
      onClick?.();
    }
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted cursor-pointer select-none">
      {/* IMAGE / PLACEHOLDER */}
      <motion.div
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onTapStart={handleStart}
        onTapCancel={handleEnd}
        onTap={handleTap}
        transition={{ duration: 0.2 }}
        className="absolute inset-0"
      >
        {item.image_url ? (
          <Image
            src={item.thumbnail_url || item.image_url}
            alt={item.journal_title ?? "Gallery"}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover pointer-events-none" // prevent image drag
            unoptimized
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
            No image
          </div>
        )}
      </motion.div>

      {/* READ-ONLY OVERLAY (GRACE MODE) */}
      {disabled && <div className="absolute inset-0 z-10 bg-black/10" />}
    </div>
  );
}
