import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
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
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-0">
        {/* Page Header */}
        <div className="mb-8 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-2xl sm:text-3xl font-bold text-transparent">
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
              className="h-9 rounded-full border-zinc-200/50 bg-white/50 backdrop-blur-sm hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <Link href="/settings">← Kembali</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-6 pb-24">
          {/* ================= PENDING CHECKOUT ================= */}
          {pendingIntent ? (
            <Card className="p-6 border-zinc-200/50 bg-white/50 shadow-xl shadow-pink-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
              <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                      Checkout Tertunda
                    </p>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {joinName(pendingIntent)}
                  </h3>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30">
                  Menunggu
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Jumlah Tagihan
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                    {formatIDR(Number(pendingIntent.final_price_idr))}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Dibuat Pada
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateTimeID(pendingIntent.created_at)}
                  </p>
                </div>
              </div>

              {pendingIntent.coupon_code && (
                <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full border border-pink-500/20">
                  <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">
                    Kupon Terpasang:
                  </span>
                  <span className="text-xs font-bold text-pink-700 dark:text-pink-300">
                    {pendingIntent.coupon_code}
                  </span>
                </div>
              )}

              <div className="bg-zinc-50/80 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/50 dark:border-white/10 mb-6">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Selesaikan pembayaran dalam:
                </p>
                <PaymentCountdown expiresAt={pendingIntent.expires_at} />
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40"
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
                    variant="ghost"
                    className="w-full h-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    Batalkan Transaksi
                  </Button>
                </form>
              </div>
            </Card>
          ) : null}

          {/* ================= PAYMENT HISTORY ================= */}
          <div>
            <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent inline-block">
              Riwayat Transaksi
            </h2>

            {!payments || payments.length === 0 ? (
              <Card className="p-8 rounded-3xl border-zinc-200/50 bg-white/50 text-center backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <span className="text-2xl">🧾</span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Belum ada riwayat pembayaran.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {payments.map((p: any) => {
                  const isPaid = p.status === "paid";
                  const isFailed = p.status === "failed";
                  const isExpired = p.status === "expired";

                  return (
                    <Card
                      key={p.id}
                      className="group relative overflow-hidden p-5 rounded-2xl border-zinc-200/50 bg-white/40 transition-all hover:bg-white/60 hover:shadow-lg hover:shadow-pink-500/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div className="flex flex-col gap-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                                isPaid
                                  ? "bg-green-100 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800"
                                  : isFailed
                                    ? "bg-red-100 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800"
                                    : "bg-orange-100 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800"
                              }`}
                            >
                              {isPaid ? "✓" : isFailed ? "✕" : "⏱"}
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground">
                                {joinName(p)}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTimeID(p.paid_at || p.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {formatIDR(Number(p.gross_amount))}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isPaid
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : isFailed
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              }`}
                            >
                              {isPaid
                                ? "Lunas"
                                : isFailed
                                  ? "Gagal"
                                  : "Expired"}
                            </span>
                          </div>
                        </div>

                        {/* Detail Row (Collapsible/Expandable feel) */}
                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-200/50 dark:border-white/5 pt-3 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-0.5">
                              Metode Pembayaran
                            </p>
                            <p className="font-medium text-foreground">
                              {p.payment_type
                                ? p.payment_type
                                    .replace(/_/g, " ")
                                    .toUpperCase()
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-0.5">
                              Channel
                            </p>
                            <p className="font-medium text-foreground">
                              {p.payment_channel
                                ? p.payment_channel.toUpperCase()
                                : "—"}
                            </p>
                          </div>
                          <div className="col-span-2 flex justify-between items-center text-[10px] text-muted-foreground/70 font-mono mt-1">
                            <span>ID: {p.id}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
