import { getArchivedCouples, getActiveCouple } from "@/lib/couples/queries";
import { restoreCouple } from "@/lib/couples/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ArchiveCouplePage() {
  const archivedCouples = await getArchivedCouples();
  const activeCouple = await getActiveCouple();

  const canRestore = !activeCouple;

  /* ================= EMPTY STATE ================= */
  if (archivedCouples.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card
          className="
            w-full max-w-sm
            rounded-3xl
            border
            bg-gradient-to-br
            from-muted/40
            via-background
            to-background
            p-6
            text-center
            space-y-3
          "
        >
          <p className="text-base font-medium">Belum Ada Arsip Hubungan</p>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Hubungan yang kamu arsipkan akan muncul di sini sebagai kenangan
            yang pernah kamu simpan.
          </p>

          <Button asChild variant="outline" className="mt-2">
            <Link href="/couple">Kembali ke Hubungan Aktif</Link>
          </Button>
        </Card>
      </div>
    );
  }

  /* ================= MAIN LIST ================= */
  return (
    <div className="space-y-6 px-4 pb-24">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Arsip Hubungan</h1>
        <p className="text-sm text-muted-foreground">
          Kenangan dari hubungan yang pernah kamu simpan
        </p>
      </header>

      {!canRestore && (
        <Card className="border bg-muted/40 p-4 text-sm">
          Untuk memulihkan hubungan dari arsip, kamu perlu mengarsipkan hubungan
          yang sedang aktif terlebih dahulu.
        </Card>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {archivedCouples.map((couple) => (
          <Card
            key={couple.id}
            className="
              rounded-2xl
              border
              p-5
              space-y-3
              bg-gradient-to-br
              from-background
              to-muted/20
            "
          >
            {/* TITLE */}
            <div>
              <p className="font-medium">
                {couple.male_name} & {couple.female_name}
              </p>

              <p className="text-xs text-muted-foreground">
                Diarsipkan pada{" "}
                {new Date(couple.archived_at).toLocaleDateString("id-ID")}
              </p>
            </div>

            {/* META */}
            <p className="text-sm text-muted-foreground">
              Mulai hubungan:{" "}
              {new Date(couple.relationship_start_date).toLocaleDateString(
                "id-ID",
              )}
            </p>

            {/* ACTIONS */}
            <div className="space-y-1.5 pt-1">
              {canRestore ? (
                <form action={restoreCouple.bind(null, couple.id)}>
                  <Button variant="outline" className="w-full">
                    Pulihkan Hubungan Ini
                  </Button>
                </form>
              ) : (
                <Button disabled variant="outline" className="w-full">
                  Tidak bisa dipulihkan
                </Button>
              )}

              <Button
                asChild
                variant="ghost"
                className="w-full text-destructive"
              >
                <Link href={`/couple/restore/delete/${couple.id}`}>
                  Hapus Arsip Permanen
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
