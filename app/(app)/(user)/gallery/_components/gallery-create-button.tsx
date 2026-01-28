"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryCreateSheet } from "./gallery-create-sheet";

type Props = {
  coupleId: string;
  isTrial: boolean;
  isGrace: boolean;
  count: number;
  limit: number;
};

export function GalleryCreateButton({
  coupleId,
  isTrial,
  isGrace,
  count,
  limit,
}: Props) {
  const disabled = isGrace || (isTrial && count >= limit);

  return (
    <GalleryCreateSheet
      coupleId={coupleId}
      trigger={
        <Button size="icon" disabled={disabled}>
          <Plus className="h-5 w-5" />
        </Button>
      }
    />
  );
}
