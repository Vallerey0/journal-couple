import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon, ArchiveRestoreIcon } from "lucide-react";

export function CoupleEmpty() {
  return (
    <Card className="border-zinc-200/50 bg-white/50 p-8 text-center shadow-lg shadow-pink-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 opacity-20 blur-lg" />
        <PlusIcon className="absolute h-8 w-8 text-pink-500" />
      </div>

      <div className="space-y-2">
        <h2 className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-pink-400 dark:to-purple-400">
          Mulai Cerita Cintamu
        </h2>

        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
          Belum ada cerita aktif. Mulai lembaran baru atau buka kembali kenangan
          lama yang tersimpan.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <Button
          asChild
          className="group h-12 w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40"
        >
          <Link href="/couple/new">
            <PlusIcon className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Buat Cerita Baru
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-12 w-full rounded-full border-zinc-200/50 bg-white/50 text-zinc-700 hover:bg-white/80 hover:text-pink-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-pink-400"
        >
          <Link href="/couple/restore">
            <ArchiveRestoreIcon className="mr-2 h-4 w-4" />
            Pulihkan dari Arsip
          </Link>
        </Button>
      </div>
    </Card>
  );
}
