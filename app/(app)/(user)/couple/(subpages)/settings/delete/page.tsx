"use client";

import { deleteCouple } from "@/lib/couples/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export default function DeleteCouplePage() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-orange-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-rose-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 space-y-6">
        <header>
          <h1 className="bg-gradient-to-r from-red-500 via-orange-500 to-rose-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Hapus Hubungan Permanen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tindakan ini tidak bisa dibatalkan.
          </p>
        </header>

        <Card className="p-6 space-y-4 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[24px]">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Jika kamu yakin ingin menghapus semua kenangan dan data hubungan
            ini, ketik <strong className="text-red-500">HAPUS</strong> di bawah
            ini.
          </p>

          <form
            action={(formData) => {
              if (isPending) return;
              startTransition(async () => {
                await deleteCouple(formData);
              });
            }}
            className="space-y-4"
          >
            <Input
              name="confirm_text"
              placeholder="Ketik HAPUS"
              required
              disabled={isPending}
              className="bg-white/5 border-red-500/20 focus:border-red-500/50 focus:ring-red-500/20 disabled:opacity-50"
            />

            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              className="w-full h-11 rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghapus...</span>
                </div>
              ) : (
                "Hapus Permanen"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
