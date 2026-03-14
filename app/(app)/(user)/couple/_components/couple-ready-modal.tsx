"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, Lightbulb, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

export function CoupleReadyModal({ slug }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const publicUrl = `https://journalcouple.com/${slug}`;

  useEffect(() => {
    // Check if we just came from creation
    const isNew =
      new URLSearchParams(window.location.search).get("new") === "true";
    if (isNew) {
      setOpen(true);
      // Clean up URL without refreshing
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md rounded-[32px] border-white/20 bg-indigo-950/90 backdrop-blur-xl text-white p-5 overflow-y-auto max-h-[95vh]">
        <DialogHeader className="space-y-2 pt-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/20 text-pink-500">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            🎉 Journal kalian siap!
          </DialogTitle>
          <DialogDescription className="text-center text-indigo-100/70 text-sm">
            Halaman journal kalian sudah aktif.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* LINK BOX */}
          <div className="relative group">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3 border border-white/10 transition-colors group-hover:bg-white/15">
              <code className="flex-1 text-xs font-medium text-pink-300 break-all">
                {publicUrl}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-center text-[13px] text-indigo-100/80 leading-snug">
            Tambahkan foto, cerita, dan lagu favorit untuk membuat halaman
            kalian semakin hidup.
          </p>

          {/* TIP BOX */}
          <div className="flex gap-2 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
            <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/90 leading-tight">
              <span className="font-bold">Tip:</span> Nama link bisa diubah
              kapan saja dari halaman Home.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-2">
          <Button
            asChild
            className="w-full h-11 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-pink-500/20 border-0"
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Page
            </a>
          </Button>
          <Button
            variant="ghost"
            className="w-full h-9 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-xs"
            onClick={() => setOpen(false)}
          >
            Nanti saja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
