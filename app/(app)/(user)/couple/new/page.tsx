import { redirect } from "next/navigation";
import { getActiveCouple } from "@/lib/couples/queries";
import { CoupleForm } from "../_components/couple-form";

export default async function NewCouplePage() {
  const couple = await getActiveCouple();

  // tidak boleh create kalau sudah ada couple aktif
  if (couple) {
    redirect("/couple");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Mulai Cerita Baru</h1>
        <p className="text-sm text-muted-foreground">
          Isi informasi dasar hubungan kalian
        </p>
      </header>

      <CoupleForm mode="create" />
    </div>
  );
}
