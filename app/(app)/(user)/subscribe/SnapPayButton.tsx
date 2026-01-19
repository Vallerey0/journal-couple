"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    snap?: {
      embed?: (
        token: string,
        opts: {
          embedId: string;
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
      pay?: (
        token: string,
        opts?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

async function waitForSnapEmbed(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.snap?.embed) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

type Props = {
  intentId: string;
};

export default function SnapPayButton({ intentId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [embedTick, setEmbedTick] = useState(0);

  const embedId = useMemo(() => `midtrans-embed-${intentId}`, [intentId]);

  async function startPayment() {
    if (loading) return;

    setLoading(true);
    setNote(null);
    setOpen(true);

    try {
      if (!token) {
        const res = await fetch("/api/pay/midtrans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intentId }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.token) {
          setNote("Pembayaran belum bisa diproses. Coba lagi sebentar.");
          return;
        }

        setToken(String(json.token));
        setRedirectUrl(json.redirect_url ? String(json.redirect_url) : null);
      }

      setEmbedTick((v) => v + 1);
    } catch {
      setNote("Terjadi kendala saat memulai pembayaran. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !token) return;
    const snapToken = token;

    let cancelled = false;

    async function mount() {
      setNote("Memuat tampilan pembayaran...");

      const ready = await waitForSnapEmbed(8000);
      if (cancelled) return;

      if (!ready) {
        setNote(
          "Sistem pembayaran belum siap. Coba lagi sebentar atau buka halaman Midtrans."
        );
        return;
      }

      const host = document.getElementById(embedId);
      if (!host) {
        setNote("Kontainer pembayaran tidak ditemukan. Coba refresh halaman.");
        return;
      }

      try {
        host.innerHTML = "";

        window.snap!.embed!(snapToken, {
          embedId,
          onSuccess: () => {
            setOpen(false);
            router.replace("/home?paid=1");
            router.refresh();
          },
          onPending: () => {
            setOpen(false);
            router.replace("/home?pending=1");
            router.refresh();
          },
          onError: () => {
            setNote("Pembayaran gagal. Kamu bisa coba lagi.");
          },
          onClose: () => {
            setOpen(false);
            setNote(
              "Pembayaran belum selesai. Kamu bisa melanjutkan kapan saja sebelum batas waktunya."
            );
          },
        });

        setNote(null);
      } catch {
        setNote(
          "Terjadi kendala saat memuat tampilan pembayaran. Kamu bisa buka halaman Midtrans."
        );
      }
    }

    void mount();

    return () => {
      cancelled = true;
    };
  }, [embedId, embedTick, open, router, token]);

  return (
    <>
      <Card className="gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Pembayaran</p>
          <p className="text-xs text-muted-foreground">
            Pembayaran tampil sebagai popup di halaman ini.
          </p>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={startPayment}
          disabled={loading}
        >
          {loading ? "Menyiapkan pembayaran..." : "Bayar dengan Midtrans"}
        </Button>

        {redirectUrl ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              window.location.href = redirectUrl;
            }}
          >
            Buka halaman Midtrans
          </Button>
        ) : null}

        {note ? (
          <p className="text-center text-xs text-muted-foreground">{note}</p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Diproses aman melalui mitra resmi (Midtrans).
          </p>
        )}
      </Card>

      <div className={open ? "fixed inset-0 z-[100] bg-black/50" : "hidden"}>
        <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col bg-background pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setNote(null);
              }}
            >
              Tutup
            </Button>

            <p className="text-sm font-semibold">Pembayaran</p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmbedTick((v) => v + 1)}
              disabled={!token}
            >
              Ulangi
            </Button>
          </div>

          <div className="relative flex-1 bg-white" data-midtrans-embed>
            <div id={embedId} className="absolute inset-0" />
            {!token ? (
              <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center text-sm text-muted-foreground">
                Menyiapkan pembayaran...
              </div>
            ) : null}
          </div>

          {note ? (
            <div className="border-t px-4 py-3">
              <p className="text-center text-xs text-muted-foreground">
                {note}
              </p>
            </div>
          ) : null}

          {redirectUrl ? (
            <div className="border-t p-3">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  window.location.href = redirectUrl;
                }}
              >
                Buka halaman Midtrans
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
