"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  expiresAt: string | null;
};

export function PaymentCountdown({ expiresAt }: Props) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ⛔ jangan render apa pun sebelum client mount
  if (!mounted || !expiresAt) {
    return (
      <p className="text-xs text-muted-foreground">Menghitung sisa waktu…</p>
    );
  }

  const endTime = new Date(expiresAt).getTime();
  const diff = endTime - now;

  if (diff <= 0) {
    return (
      <p className="text-xs font-medium text-destructive">
        Waktu pembayaran telah habis
      </p>
    );
  }

  const TOTAL = 30 * 60 * 1000; // 30 menit
  const progress = Math.max(0, Math.min(100, (diff / TOTAL) * 100));

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        Sisa waktu pembayaran{" "}
        <span className="font-semibold text-foreground">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </p>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-300",
            progress > 30
              ? "bg-emerald-500"
              : progress > 10
                ? "bg-amber-500"
                : "bg-destructive",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
