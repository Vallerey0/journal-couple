"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GalleryEditButton } from "./gallery-edit-button";

export type GalleryItem = {
  id: string;
  image_url: string;
  journal_title: string | null;
  journal_text: string | null;
};

export type GalleryCardProps = {
  item: GalleryItem;
  disabled?: boolean;
};

export function GalleryCard({ item, disabled = false }: GalleryCardProps) {
  const [active, setActive] = useState(false);

  function open() {
    if (disabled) return;
    setActive(true);
  }

  function close() {
    setActive(false);
  }

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-2xl"
      onClick={open}
    >
      {/* IMAGE */}
      <motion.div
        animate={
          active && !disabled
            ? { scale: 1.04, filter: "blur(4px)" }
            : { scale: 1, filter: "blur(0px)" }
        }
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src={item.image_url}
          alt={item.journal_title ?? "Gallery"}
          fill
          className="object-cover"
        />
      </motion.div>

      {/* OVERLAY + EDIT */}
      <AnimatePresence>
        {active && !disabled && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
          >
            {/* EDIT BUTTON */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <GalleryEditButton item={item} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* READ-ONLY OVERLAY (GRACE) */}
      {disabled && <div className="absolute inset-0 z-10 bg-black/10" />}
    </div>
  );
}
