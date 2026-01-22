"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";

import { GalleryCard, type GalleryItem } from "./gallery-card";
import { GalleryEmptyTrial } from "./gallery-empty-trial";
import { GalleryEmptyPremium } from "./gallery-empty-premium";
import { GalleryLimitTrial } from "./gallery-limit-trial";
import { lightHaptic } from "@/utils/haptics";

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
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [reorderMode, setReorderMode] = useState(false);

  // memastikan haptic hanya 1x per drag
  const didHaptic = useRef(false);

  // sync saat data server berubah
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const count = items.length;

  /**
   * =========================
   * EMPTY STATE
   * =========================
   */
  if (count === 0) {
    return (
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
    );
  }

  /**
   * =========================
   * GRACE PERIOD (READ ONLY)
   * =========================
   */
  if (isGrace) {
    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <GalleryCard key={item.id} item={item} disabled />
          ))}
        </div>

        <GalleryLimitTrial />
      </>
    );
  }

  /**
   * =========================
   * REORDER MODE
   * =========================
   */
  if (reorderMode) {
    return (
      <>
        <button
          onClick={() => setReorderMode(false)}
          className="mb-3 text-xs text-muted-foreground"
        >
          Selesai mengatur
        </button>

        <Reorder.Group
          axis="y"
          values={items}
          onReorder={(newOrder) => {
            setItems(newOrder);

            /**
             * TODO BACKEND:
             * newOrder.map((item, index) => ({
             *   id: item.id,
             *   display_order: index + 1,
             *   is_primary: index === 0,
             * }))
             */
          }}
          className="grid grid-cols-2 gap-4"
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className="touch-none"
              whileDrag={{ scale: 1.05 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onDragStart={() => {
                if (!didHaptic.current) {
                  lightHaptic();
                  didHaptic.current = true;
                }
              }}
              onDragEnd={() => {
                didHaptic.current = false;
              }}
            >
              <motion.div layout>
                <GalleryCard item={item} />
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </>
    );
  }

  /**
   * =========================
   * TRIAL LIMIT
   * =========================
   */
  if (isTrial && count >= limit) {
    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </div>

        <GalleryLimitTrial />
      </>
    );
  }

  /**
   * =========================
   * NORMAL GRID
   * =========================
   */
  return (
    <>
      <button
        onClick={() => setReorderMode(true)}
        className="mb-3 text-xs text-muted-foreground"
      >
        Atur urutan
      </button>

      <AnimatePresence>
        <motion.div
          key="grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 gap-4"
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.2,
                delay: index === 0 ? 0.05 : 0,
                ease: "easeOut",
              }}
            >
              <GalleryCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
