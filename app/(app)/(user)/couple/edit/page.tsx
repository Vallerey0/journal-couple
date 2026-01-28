import { redirect } from "next/navigation";
import { getActiveCouple } from "@/lib/couples/queries";
import { CoupleForm } from "../_components/couple-form";

export default async function EditCouplePage() {
  const couple = await getActiveCouple();

  if (!couple) {
    redirect("/couple/new");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Lengkapi Cerita Hubungan</h1>
        <p className="text-sm text-muted-foreground">
          Kamu bisa melengkapi semua detail hubungan di sini
        </p>
      </header>

      <CoupleForm mode="edit" couple={couple} />
    </div>
  );
}
