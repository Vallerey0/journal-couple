"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  /** menit */
  idleMinutes?: number;
  /** optional: simpan last activity antar tab */
  storageKey?: string;
};

export default function AdminIdleLogout({
  idleMinutes = 15,
  storageKey = "jc_admin_last_activity",
}: Props) {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);
  const supabase = createClient();

  const idleMs = idleMinutes * 60 * 1000;

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  async function logout(reason = "idle") {
    clearTimer();
    try {
      await supabase.auth.signOut();
    } finally {
      // kasih info biar UI bisa nampilin message
      router.replace(`/admin/login?error=${encodeURIComponent(reason)}`);
      router.refresh();
    }
  }

  function bumpActivity() {
    const now = Date.now();
    localStorage.setItem(storageKey, String(now));

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      logout("idle");
    }, idleMs);
  }

  useEffect(() => {
    // start
    bumpActivity();

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
      "focus",
    ];

    const onActivity = () => bumpActivity();
    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    // sync antar tab: kalau tab lain ada aktivitas, tab ini ikut reset timer
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === storageKey) bumpActivity();
    };
    window.addEventListener("storage", onStorage);

    // kalau kembali ke tab, reset timer
    const onVis = () => {
      if (!document.hidden) bumpActivity();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearTimer();
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleMs]);

  return null;
}
