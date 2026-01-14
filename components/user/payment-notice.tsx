"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

type Props = {
  variant: "success" | "pending" | "error";
};

export function PaymentNotice({ variant }: Props) {
  const router = useRouter();

  const content =
    variant === "success"
      ? {
          title: "Pembayaran diterima",
          desc: "Sedang memproses aktivasi premium. Halaman akan otomatis diperbarui.",
        }
      : variant === "pending"
      ? {
          title: "Menunggu pembayaran",
          desc: "Selesaikan pembayaran kamu. Premium akan aktif otomatis setelah pembayaran terkonfirmasi.",
        }
      : {
          title: "Pembayaran gagal",
          desc: "Kamu bisa coba lagi atau pilih metode pembayaran lain.",
        };

  useEffect(() => {
    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= 6) clearInterval(t); // ~30 detik
    }, 5000);

    return () => clearInterval(t);
  }, [router]);

  return (
    <Card className="p-4">
      <p className="text-sm font-semibold">{content.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{content.desc}</p>
    </Card>
  );
}
