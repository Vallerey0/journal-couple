"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    snap?: { pay: (token: string, opts?: any) => void };
  }
}

async function waitForSnap(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.snap?.pay) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

export default function SnapPayButton({ intentId }: { intentId: string }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const router = useRouter();

  async function pay() {
    setLoading(true);
    setNote(null);

    try {
      const res = await fetch("/api/pay/midtrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId }),
      });

      const json = await res.json();

      if (!res.ok || !json?.token) {
        setNote("Pembayaran belum bisa diproses. Coba lagi sebentar.");
        return;
      }

      setNote("Menyiapkan pembayaran…");

      const ready = await waitForSnap(5000);
      if (!ready) {
        setNote("Sedang menyiapkan pembayaran…");
        return;
      }

      window.snap!.pay(json.token, {
        onSuccess: () => {
          router.replace("/home?paid=1");
          router.refresh();
        },
        onPending: () => {
          router.replace("/home?pending=1");
          router.refresh();
        },
        onError: () => {
          router.replace("/home?pay_error=1");
          router.refresh();
        },
        onClose: () => {
          setNote(null);
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={pay} disabled={loading}>
        {loading ? "Menyiapkan pembayaran…" : "Bayar Sekarang"}
      </Button>

      {note ? (
        <p className="text-center text-xs text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}
