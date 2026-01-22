"use client";

import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryFormSheet } from "./gallery-form-sheet";

type Props = {
  coupleId?: string;
};

export function GalleryEmptyPremium({ coupleId = "" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <ImagePlus className="h-7 w-7 text-muted-foreground" />
      </div>

      <h3 className="text-sm font-medium">Gallery masih kosong</h3>
      <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
        Simpan momen berharga kalian dan putar kembali kapan saja.
      </p>

      <div className="mt-5">
        <GalleryFormSheet
          mode="create"
          coupleId={coupleId}
          trigger={
            <Button size="sm" className="rounded-full">
              Tambah Kenangan Pertama
            </Button>
          }
        />
      </div>
    </div>
  );
}
