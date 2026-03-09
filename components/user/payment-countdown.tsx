"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  expiresAt: string | null;
  createdAt?: string | null;
};

export function PaymentCountdown({ expiresAt, createdAt }: Props) {
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
  if (!mounted || !expiresAt || now === 0) {
    return (
      <p className="text-xs text-muted-foreground">Menghitung sisa waktu…</p>
    );
  }

  const endTime = new Date(expiresAt).getTime();
  const startTime = createdAt
    ? new Date(createdAt).getTime()
    : endTime - 30 * 60 * 1000;
  const diff = endTime - now;
  const totalDuration = Math.max(1000, endTime - startTime); // Avoid division by zero

  if (diff <= 0) {
    return (
      <p className="text-xs font-medium text-destructive">
        Waktu pembayaran telah habis
      </p>
    );
  }

  const progress = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

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

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
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
