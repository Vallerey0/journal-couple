import { deleteCouple } from "@/utils/couples/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DeleteCouplePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-destructive">
          Hapus Hubungan Permanen
        </h1>
        <p className="text-sm text-muted-foreground">
          Tindakan ini tidak bisa dibatalkan.
        </p>
      </header>

      <Card className="p-6 space-y-4 border-destructive">
        <p className="text-sm leading-relaxed">
          Jika kamu yakin ingin menghapus semua kenangan dan data hubungan ini,
          ketik <strong>HAPUS</strong> di bawah ini.
        </p>

        <form action={deleteCouple} className="space-y-4">
          <Input name="confirm_text" placeholder="Ketik HAPUS" required />

          <Button type="submit" variant="destructive" className="w-full">
            Hapus Permanen
          </Button>
        </form>
      </Card>
    </div>
  );
}
