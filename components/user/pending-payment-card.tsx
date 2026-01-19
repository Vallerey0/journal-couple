"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentCountdown } from "@/components/user/payment-countdown";

type Props = {
  intentId: string;
  expiresAt: string;
  nextPath: string;
};

export function PendingPaymentCard({ intentId, expiresAt, nextPath }: Props) {
  return (
    <Card className="p-4 space-y-3">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold">
          Ada pembayaran yang belum selesai
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Selesaikan pembayaran untuk mengaktifkan langganan kamu.
        </p>
      </div>

      {/* ⏳ Countdown */}
      <PaymentCountdown expiresAt={expiresAt} />

      {/* CTA — mobile-first (tumpuk tiga) */}
      <div className="space-y-2">
        {/* Primary */}
        <Button asChild className="w-full">
          <Link href={`/subscribe/pay?intent=${intentId}`}>
            Lanjutkan pembayaran
          </Link>
        </Button>

        {/* Secondary */}
        <Button asChild variant="outline" className="w-full">
          <Link href="/subscribe">Ganti plan / kupon</Link>
        </Button>

        {/* Tertiary */}
        <form action="/api/cancel-intent" method="POST">
          <input type="hidden" name="intent_id" value={intentId} />
          <input type="hidden" name="next" value={nextPath} />
          <Button
            type="submit"
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Batalkan checkout
          </Button>
        </form>
      </div>

      {/* Helper */}
      <p className="text-[11px] text-muted-foreground">
        Batas waktu ini hanya untuk reservasi checkout. Pembayaran tetap
        diproses jika berhasil.
      </p>
    </Card>
  );
}
