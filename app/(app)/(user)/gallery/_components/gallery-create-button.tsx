"use client";

import { Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GalleryFormSheet } from "./gallery-form-sheet";

type Props = {
  isTrial: boolean;
  isGrace: boolean;
  count: number;
  limit: number;
  coupleId: string;
};

export function GalleryCreateButton({
  isTrial,
  isGrace,
  count,
  limit,
  coupleId,
}: Props) {
  const limitReached = isTrial && count >= limit;

  // 🔒 Grace atau Trial limit → arahkan ke subscribe
  if (isGrace || limitReached) {
    return (
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full opacity-60"
        asChild
      >
        <Link href="/subscribe" aria-label="Upgrade ke Premium">
          <Lock className="h-5 w-5" />
        </Link>
      </Button>
    );
  }

  // ✅ Normal (bisa upload)
  return (
    <GalleryFormSheet
      mode="create"
      coupleId={coupleId}
      trigger={
        <Button
          size="icon"
          className="rounded-full bg-white/90 text-black hover:bg-white"
          aria-label="Tambah kenangan"
        >
          <Plus className="h-5 w-5" />
        </Button>
      }
    />
  );
}
