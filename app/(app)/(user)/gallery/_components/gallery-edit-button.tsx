"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryFormSheet } from "./gallery-form-sheet";
import type { GalleryItem } from "./gallery-card";

type Props = {
  item: GalleryItem;
};

export function GalleryEditButton({ item }: Props) {
  return (
    <GalleryFormSheet
      mode="edit"
      coupleId={item.id /* sementara, nanti ganti couple_id */}
      trigger={
        <Button
          size="icon"
          className="rounded-full bg-white text-black shadow"
          aria-label="Edit kenangan"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
