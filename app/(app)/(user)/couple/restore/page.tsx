import { getArchivedCouples, getActiveCouple } from "@/lib/couples/queries";
import { restoreCouple } from "@/lib/couples/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  ArchiveRestore,
  Heart,
  Trash2,
  Calendar,
} from "lucide-react";

export default async function ArchiveCouplePage() {
  const archivedCouples = await getArchivedCouples();
  const activeCouple = await getActiveCouple();

  const canRestore = !activeCouple;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 p-4 pb-10 space-y-6">
        {/* HEADER */}
        <header className="space-y-4 pt-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10"
          >
            <Link href="/couple">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </Button>

          <div className="px-2">
            <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Arsip Hubungan
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kenangan dari hubungan yang pernah kamu simpan
            </p>
          </div>
        </header>

        {/* INFO ALERT IF CANNOT RESTORE */}
        {!canRestore && (
          <div className="mx-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400 backdrop-blur-md">
            <p className="font-medium mb-1">Arsip Aktif Terdeteksi</p>
            Untuk memulihkan hubungan dari arsip, kamu perlu mengarsipkan
            hubungan yang sedang aktif terlebih dahulu.
          </div>
        )}

        {/* EMPTY STATE */}
        {archivedCouples.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <ArchiveRestore className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum Ada Arsip</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-8">
              Hubungan yang kamu arsipkan akan muncul di sini sebagai kenangan
              yang tersimpan aman.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/couple">Kembali ke Dashboard</Link>
            </Button>
          </div>
        ) : (
          /* LIST */
          <div className="space-y-4">
            {archivedCouples.map((couple) => (
              <Card
                key={couple.id}
                className="overflow-hidden rounded-[24px] bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
              >
                <div className="p-6 space-y-6">
                  {/* COUPLE NAMES */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-pink-500">
                      <Heart className="h-6 w-6 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">
                        {couple.male_name} & {couple.female_name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3" />
                        Mulai:{" "}
                        {new Date(
                          couple.relationship_start_date,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* ARCHIVED DATE */}
                  <div className="bg-white/5 rounded-xl p-3 text-xs text-muted-foreground text-center">
                    Diarsipkan pada{" "}
                    {new Date(couple.archived_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>

                  {/* ACTIONS */}
                  <div className="grid gap-3 pt-2">
                    {canRestore ? (
                      <form action={restoreCouple.bind(null, couple.id)}>
                        <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-medium text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all hover:scale-[1.02]">
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Pulihkan Hubungan Ini
                        </Button>
                      </form>
                    ) : (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full h-11 rounded-xl opacity-50 cursor-not-allowed"
                      >
                        Tidak bisa dipulihkan saat ini
                      </Button>
                    )}

                    <Button
                      asChild
                      variant="ghost"
                      className="w-full h-11 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Link href="/couple/settings/delete">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Permanen
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
