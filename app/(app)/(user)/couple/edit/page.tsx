import { redirect } from "next/navigation";
import { getActiveCouple } from "@/lib/couples/queries";
import { CoupleForm } from "../_components/couple-form";

export default async function EditCouplePage() {
  const couple = await getActiveCouple();

  if (!couple) {
    redirect("/couple/new");
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 space-y-6 pt-4">
        <header className="space-y-1 px-1">
          <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
            Lengkapi Cerita Hubungan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kamu bisa melengkapi semua detail hubungan di sini
          </p>
        </header>

        <CoupleForm mode="edit" couple={couple} />
      </div>
    </div>
  );
}
