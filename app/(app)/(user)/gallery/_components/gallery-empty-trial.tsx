"use client";

import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GalleryCreateSheet } from "./gallery-create-sheet";

type Props = {
  coupleId?: string;
};

export function GalleryEmptyTrial({ coupleId = "" }: Props) {
  return (
    <div className="flex justify-center p-4">
      <Card className="w-full max-w-sm border-zinc-200/50 bg-white/50 p-8 text-center shadow-lg shadow-pink-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
          <div className="absolute h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 opacity-20 blur-lg" />
          <ImagePlus className="relative h-8 w-8 text-pink-500" />
        </div>

        <h3 className="mb-2 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Belum Ada Kenangan
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Kamu bisa menyimpan hingga <b>5 kenangan</b> selama masa trial.
        </p>

        <GalleryCreateSheet
          coupleId={coupleId}
          trigger={
            <Button className="h-12 w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40">
              <ImagePlus className="mr-2 h-4 w-4" />
              Tambah Kenangan
            </Button>
          }
        />
      </Card>
    </div>
  );
}
