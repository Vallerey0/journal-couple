"use client";

import { Reorder, motion } from "framer-motion";
import type { GalleryItem } from "./gallery-card";
import { GalleryCard } from "./gallery-card";

type Props = {
  items: GalleryItem[];
  onReorderEnd: (items: GalleryItem[]) => void;
};

export function GalleryReorderGrid({ items, onReorderEnd }: Props) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorderEnd}
      className="grid grid-cols-2 gap-4"
    >
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          whileDrag={{ scale: 1.05 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="touch-none"
        >
          <motion.div layout transition={{ duration: 0.18, ease: "easeOut" }}>
            <GalleryCard item={item} />
          </motion.div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
