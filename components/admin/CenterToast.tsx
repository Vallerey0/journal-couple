"use client";

import { useEffect, useState } from "react";

export function useCenterToast() {
  const [msg, setMsg] = useState<string | null>(null);

  function show(message: string, ms = 1800) {
    setMsg(message);
    window.setTimeout(() => setMsg(null), ms);
  }

  return { msg, show };
}

export function CenterToast({ message }: { message: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!!message);
  }, [message]);

  if (!open || !message) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="pointer-events-none rounded-2xl border bg-background/95 px-4 py-3 text-sm shadow-lg backdrop-blur">
        {message}
      </div>
    </div>
  );
}
