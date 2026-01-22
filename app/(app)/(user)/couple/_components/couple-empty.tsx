import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CoupleEmpty() {
  return (
    <Card className="p-8 text-center space-y-6 rounded-3xl">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Belum ada cerita aktif</h2>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Kamu bisa memulai hubungan baru atau membuka kembali kenangan lama.
        </p>
      </div>

      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link href="/couple/new">Mulai Cerita Baru</Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href="/couple/restore">Pulihkan dari Arsip</Link>
        </Button>
      </div>
    </Card>
  );
}
