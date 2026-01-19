"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  paid: boolean;
  pending: boolean;
  activeUntil: string | null;
  currentPlanId: string | null;
};

export default function HomeAutoRefresh({
  paid,
  pending,
  activeUntil,
  currentPlanId,
}: Props) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triesRef = useRef(0);

  const alreadyActive = useMemo(() => {
    const now = Date.now();
    const activeMs = activeUntil ? new Date(activeUntil).getTime() : 0;
    return Boolean(currentPlanId) && activeMs > now;
  }, [activeUntil, currentPlanId]);

  // start polling hanya ketika datang dari pembayaran & belum aktif
  useEffect(() => {
    if (!paid && !pending) return;
    if (alreadyActive) return;

    // jangan bikin interval dobel
    if (timerRef.current) return;

    triesRef.current = 0;
    timerRef.current = setInterval(() => {
      triesRef.current += 1;
      router.refresh();

      if (triesRef.current >= 10) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 2500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [paid, pending, alreadyActive, router]);

  // stop polling begitu status sudah aktif (setelah webhook update profile)
  useEffect(() => {
    if (!alreadyActive) return;
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, [alreadyActive]);

  return null;
}
