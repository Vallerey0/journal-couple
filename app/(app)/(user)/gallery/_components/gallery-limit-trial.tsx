"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GalleryLimitTrial() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>

      <h3 className="text-sm font-medium">Batas trial tercapai</h3>
      <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
        Upgrade ke Premium untuk menyimpan lebih banyak kenangan.
      </p>

      <div className="mt-5">
        <Button asChild size="sm" className="rounded-full">
          <Link href="/subscribe">Upgrade ke Premium</Link>
        </Button>
      </div>
    </div>
  );
}
