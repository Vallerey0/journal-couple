"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  idleMinutes?: number;
  storageKey?: string;
  redirectTo?: string;
};

export default function UserIdleLogout({
  idleMinutes = 30,
  storageKey = "jc_user_last_activity",
  redirectTo = "/login?error=expired",
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

  async function forceSignOut(reason = "expired") {
    clearTimer();
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace(redirectTo);
      router.refresh();
    }
  }

  function bumpActivity() {
    const now = Date.now();
    try {
      localStorage.setItem(storageKey, String(now));
    } catch {}

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      forceSignOut("idle");
    }, idleMs);
  }

  useEffect(() => {
    // Start
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

    // Sync across tabs
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === storageKey) bumpActivity();
    };
    window.addEventListener("storage", onStorage);

    // When tab visible again, reset
    const onVis = () => {
      if (!document.hidden) bumpActivity();
    };
    document.addEventListener("visibilitychange", onVis);

    // Supabase auth state fallback: if signed out elsewhere
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "SIGNED_OUT") {
        router.replace(redirectTo);
        router.refresh();
      }
    });

    return () => {
      clearTimer();
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVis);
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleMs]);

  return null;
}
