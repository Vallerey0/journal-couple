import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { cancelPendingIntentAction } from "@/lib/cancel-intent-action";
import { PaymentCountdown } from "@/components/user/payment-countdown";
import {
  formatRemainingFull,
  formatRemainingShort,
  formatDateID,
} from "@/lib/duration";

export const revalidate = 0;

/* ================= Helpers ================= */
function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function joinName(row: any, fallback = "Premium") {
  const j = row?.subscription_plans;
  if (!j) return fallback;
  if (Array.isArray(j)) return j?.[0]?.name ?? fallback;
  return j?.name ?? fallback;
}

/* ================= Page ================= */
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <p className="text-center text-muted-foreground mb-4">
          Kamu belum login.
        </p>
        <Button asChild>
          <Link href="/login">Login Sekarang</Link>
        </Button>
      </div>
    );
  }

  /* ===== Profile ===== */
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, current_plan_id, active_until")
    .eq("id", user.id)
    .maybeSingle();

  /* ===== Pending intent ===== */
  const { data: pendingIntent } = await supabase
    .from("payment_intents")
    .select(
      `
      id,
      created_at,
      expires_at,
      final_price_idr,
      coupon_code,
      subscription_plans:plan_id ( name )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  /* ===== Last payment ===== */
  const { data: lastPayment } = await supabase
    .from("payments")
    .select(
      `
      id,
      created_at,
      paid_at,
      status,
      gross_amount,
      subscription_plans:plan_id ( name )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-5 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola akun dan langganan Anda
        </p>
      </div>

      <div className="space-y-3 px-4 sm:px-0">
        {/* ================= AKUN ================= */}
        <Card className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Profil
              </p>
              <h2 className="text-base sm:text-lg font-semibold truncate">
                {profile?.full_name ?? user.email}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {profile?.email}
              </p>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex flex-col gap-1.5">
            <Button asChild size="sm" className="w-full h-9">
              <Link href="/subscribe">Kelola Langganan</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full h-9">
              <Link href="/settings/billing">Riwayat Pembayaran</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Link href="/logout">Logout</Link>
            </Button>
          </div>
        </Card>

        {/* ================= STATUS LANGGANAN ================= */}
        <Card className="p-3 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Langganan
            </p>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
              {profile?.active_until ? "Aktif" : "Tidak Aktif"}
            </span>
          </div>

          {profile?.active_until ? (
            <div className="space-y-2">
              <p className="text-base sm:text-lg font-bold">Premium</p>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm">
                  Aktif{" "}
                  <span className="font-semibold text-foreground">
                    {formatRemainingFull(profile.active_until)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Sampai{" "}
                  <span className="font-medium">
                    {formatDateID(profile.active_until)}
                  </span>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 dark:bg-slate-100 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, 100 - ((new Date(profile.active_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Upgrade untuk akses penuh
              </p>
              <Button asChild size="sm" className="w-full h-9">
                <Link href="/subscribe">Pilih Paket</Link>
              </Button>
            </div>
          )}

          {lastPayment && (
            <div className="mt-2 pt-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Pembayaran Terakhir
              </p>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm font-medium">
                    {joinName(lastPayment)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateID(
                      lastPayment.paid_at ?? lastPayment.created_at,
                    )}
                  </p>
                </div>
                <p className="text-sm sm:text-base font-semibold whitespace-nowrap">
                  {formatIDR(Number(lastPayment.gross_amount))}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* ================= CHECKOUT TERTUNDA ================= */}
        {pendingIntent && (
          <Card className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ⏱ Checkout Tertunda
              </p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                Menunggu
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">
                    {joinName(pendingIntent)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateID(pendingIntent.created_at)}
                  </p>
                </div>
                <p className="text-sm sm:text-base font-bold text-foreground whitespace-nowrap">
                  {formatIDR(Number(pendingIntent.final_price_idr))}
                </p>
              </div>

              {pendingIntent.coupon_code && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                  <span className="text-muted-foreground">Kupon:</span>
                  <span className="font-bold">{pendingIntent.coupon_code}</span>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-muted-foreground mb-1">
                  Waktu tersisa:
                </p>
                <PaymentCountdown expiresAt={pendingIntent.expires_at} />
              </div>

              <p className="text-xs text-muted-foreground">
                Reservasi ini akan kadaluarsa sesuai waktu di atas. Pembayaran
                tetap diproses jika sudah berhasil.
              </p>

              <div className="flex flex-col gap-1.5 pt-1">
                <Button asChild size="sm" className="w-full h-9">
                  <Link href={`/subscribe/pay?intent=${pendingIntent.id}`}>
                    Lanjutkan
                  </Link>
                </Button>

                <form action={cancelPendingIntentAction} className="w-full">
                  <input
                    type="hidden"
                    name="intent_id"
                    value={pendingIntent.id}
                  />
                  <input type="hidden" name="next" value="/settings" />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="w-full h-9"
                  >
                    Batalkan
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        )}

        {/* Footer spacing */}
        <div className="h-3" />
      </div>
    </div>
  );
}
