import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { cancelPendingIntentAction } from "@/lib/cancel-intent-action";
import { PaymentCountdown } from "@/components/user/payment-countdown";

/* ================= Helpers ================= */
function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateTimeID(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

function getPaymentMethodLabel(provider?: string | null) {
  if (!provider) return "Midtrans";
  const methods: Record<string, string> = {
    credit_card: "Kartu Kredit",
    bank_transfer: "Transfer Bank",
    e_wallet: "E-Wallet",
    gcash: "GCash",
    dana: "DANA",
    ovo: "OVO",
    midtrans: "Midtrans",
  };
  return methods[provider.toLowerCase()] || provider;
}

function getStatusConfig(status?: string) {
  const configs: Record<
    string,
    { label: string; bg: string; border: string; icon: string }
  > = {
    paid: {
      label: "Pembayaran Berhasil",
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-200 dark:border-green-900",
      icon: "✓",
    },
    failed: {
      label: "Pembayaran Gagal",
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-900",
      icon: "✕",
    },
    expired: {
      label: "Pembayaran Kadaluarsa",
      bg: "bg-orange-50 dark:bg-orange-950/20",
      border: "border-orange-200 dark:border-orange-900",
      icon: "⏱",
    },
  };
  return configs[status || "pending"] || configs["pending"];
}

function getStatusTextColor(status?: string) {
  const colors: Record<string, string> = {
    paid: "text-green-800 dark:text-green-200",
    failed: "text-red-800 dark:text-red-200",
    expired: "text-orange-800 dark:text-orange-200",
  };
  return colors[status || "pending"] || "text-slate-800 dark:text-slate-200";
}

function joinName(row: any, fallback = "Premium") {
  const j = row?.subscription_plans;
  if (!j) return fallback;
  if (Array.isArray(j)) return j?.[0]?.name ?? fallback;
  return j?.name ?? fallback;
}

/* ================= Page ================= */
export default async function BillingPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) redirect("/login?next=/settings/billing");

  /* ===== Pending checkout (UX) ===== */
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

  /* ===== Final payments only ===== */
  const { data: payments } = await supabase
    .from("payments")
    .select(
      `
      id,
      created_at,
      paid_at,
      status,
      gross_amount,
      provider,
      provider_order_id,
      payment_type,
      payment_channel,
      subscription_plans:plan_id ( name )
    `,
    )
    .eq("user_id", user.id)
    .in("status", ["paid", "failed", "expired"])
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 px-4 sm:px-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Riwayat Pembayaran
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Kelola transaksi pembayaran Anda
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 rounded-lg whitespace-nowrap"
          >
            <Link href="/settings">← Kembali</Link>
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-0 space-y-4">
        {/* ================= PENDING CHECKOUT ================= */}
        {pendingIntent ? (
          <Card className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  ⏱ Checkout Tertunda
                </p>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  {joinName(pendingIntent)}
                </h3>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 whitespace-nowrap">
                Menunggu
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-0.5">
                  Jumlah
                </p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {formatIDR(Number(pendingIntent.final_price_idr))}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-0.5">
                  Dibuat
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDateTimeID(pendingIntent.created_at)}
                </p>
              </div>
            </div>

            {pendingIntent.coupon_code && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  Kupon:
                </span>
                <span className="font-bold text-foreground">
                  {pendingIntent.coupon_code}
                </span>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 mb-3">
              <p className="text-xs font-medium text-foreground mb-1.5">
                Waktu tersisa:
              </p>
              <PaymentCountdown expiresAt={pendingIntent.expires_at} />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Reservasi checkout akan kadaluarsa sesuai waktu di atas.
              Pembayaran tetap diproses jika sudah berhasil.
            </p>

            <div className="flex flex-col gap-2">
              <Button
                asChild
                size="sm"
                className="w-full h-9 rounded-lg font-medium"
              >
                <Link href={`/subscribe/pay?intent=${pendingIntent.id}`}>
                  Lanjutkan Pembayaran
                </Link>
              </Button>

              <form action={cancelPendingIntentAction} className="w-full">
                <input
                  type="hidden"
                  name="intent_id"
                  value={pendingIntent.id}
                />
                <input type="hidden" name="next" value="/settings/billing" />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full h-9 rounded-lg font-medium"
                >
                  Batalkan
                </Button>
              </form>
            </div>
          </Card>
        ) : null}

        {/* ================= PAYMENT HISTORY ================= */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">
            Transaksi Terakhir
          </h2>

          {!payments || payments.length === 0 ? (
            <Card className="p-4 sm:p-5 rounded-lg text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Belum ada riwayat pembayaran.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {payments.map((p: any) => {
                const isPaid = p.status === "paid";
                const isFailed = p.status === "failed";
                const isExpired = p.status === "expired";

                return (
                  <Card
                    key={p.id}
                    className="p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-shadow"
                  >
                    {/* Status Notification */}
                    <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-2">
                        <div className="text-lg font-bold mt-0.5">
                          {isPaid ? "✓" : isFailed ? "✕" : "⏱"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            {isPaid
                              ? "Berhasil"
                              : isFailed
                                ? "Gagal"
                                : "Kadaluarsa"}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                            {isPaid
                              ? "Pembayaran berhasil diproses"
                              : isFailed
                                ? "Terjadi kesalahan"
                                : "Waktu telah habis"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                          isPaid
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : isFailed
                              ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                        }`}
                      >
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </div>

                    {/* Payment Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-xs sm:text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                          Paket
                        </p>
                        <p className="font-semibold text-foreground line-clamp-1">
                          {joinName(p)}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                          Jumlah
                        </p>
                        <p className="font-bold text-foreground">
                          {formatIDR(Number(p.gross_amount))}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                          Tipe
                        </p>
                        <p className="font-medium text-foreground line-clamp-1">
                          {p.payment_type || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-0.5">
                          Channel
                        </p>
                        <p className="font-medium text-foreground line-clamp-1">
                          {p.payment_channel || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">
                          Tanggal:
                        </span>
                        <span className="font-medium text-foreground">
                          {formatDateTimeID(p.paid_at || p.created_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">
                          ID:
                        </span>
                        <span className="font-mono font-medium text-foreground truncate">
                          {p.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}
