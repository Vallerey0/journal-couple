import { deleteArchivedCouple } from "@/lib/couples/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DeleteArchivedCouplePage({ params }: PageProps) {
  const { id: coupleId } = await params; // ✅ WAJIB await

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-destructive">
          Hapus Arsip Hubungan
        </h1>
        <p className="text-sm text-muted-foreground">
          Arsip hubungan ini akan dihapus secara permanen dan tidak dapat
          dikembalikan.
        </p>
      </header>

      <Card className="space-y-4 border-destructive p-6">
        <p className="text-sm leading-relaxed">
          Ketik <strong>HAPUS</strong> untuk mengonfirmasi penghapusan arsip
          ini.
        </p>

        <form
          action={async (formData: FormData) => {
            "use server";
            console.log("[PAGE] submit delete archived");
            await deleteArchivedCouple(formData);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="couple_id" value={coupleId} />

          <Input
            name="confirm_text"
            placeholder="Ketik HAPUS"
            required
            autoFocus
          />

          <Button type="submit" variant="destructive" className="w-full">
            Hapus Arsip Permanen
          </Button>
        </form>
      </Card>
    </div>
  );
}
