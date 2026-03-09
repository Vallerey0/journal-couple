"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LockIcon } from "lucide-react";

export function CoupleMissingPopup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if error=missing_couple is present in the URL
    const error = searchParams.get("error");
    if (error === "missing_couple") {
      setOpen(true);
    }
  }, [searchParams]);

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("error");
      router.replace(`/couple?${newParams.toString()}`, { scroll: false });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {" "}
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <LockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-center text-xl">
            Fitur Terkunci
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Kamu harus memiliki data couple aktif untuk mengakses fitur ini
            (Gallery, Story, Music, Theme). Silakan buat atau pulihkan cerita
            cintamu terlebih dahulu.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            onClick={() => handleOpenChange(false)}
          >
            Mengerti, Saya Akan Isi Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
