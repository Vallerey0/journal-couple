import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CoupleDangerZone() {
  return (
    <Card className="p-6 space-y-3 border-destructive/40 bg-destructive/5 rounded-2xl">
      <h2 className="font-medium text-destructive">Pengaturan Hubungan</h2>

      <p className="text-sm text-muted-foreground">
        Tindakan di bawah bersifat sensitif dan dapat mengubah status hubungan
      </p>

      <Button asChild variant="outline" className="w-full border-destructive">
        <Link href="/couple/settings">Buka Pengaturan</Link>
      </Button>
    </Card>
  );
}
