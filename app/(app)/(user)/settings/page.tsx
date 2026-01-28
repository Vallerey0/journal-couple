import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cancelPendingIntentAction } from "@/lib/cancel-intent-action";
import { PaymentCountdown } from "@/components/user/payment-countdown";
import { formatRemainingFull, formatDateID } from "@/utils/duration";
import { Metadata } from "next";
import {
  User,
  CreditCard,
  LogOut,
  Crown,
  Clock,
  ChevronRight,
  Sparkles,
  Receipt,
  AlertCircle,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Account",
};

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
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-background">
        {/* Background Blobs */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-xs mx-auto">
          <div className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Login Required
            </h2>
            <p className="text-muted-foreground">
              Silakan login untuk mengakses pengaturan akun Anda.
            </p>
          </div>
          <Button
            asChild
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 shadow-lg shadow-purple-500/25"
          >
            <Link href="/login">Login Sekarang</Link>
          </Button>
        </div>
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
      id, created_at, expires_at, final_price_idr, coupon_code,
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
      id, created_at, paid_at, status, gross_amount,
      subscription_plans:plan_id ( name )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPremium = !!profile?.active_until;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background pb-24">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 px-5 pt-8 space-y-8">
        {/* HEADER */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 w-fit">
            Pengaturan
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Kelola akun & langganan
          </p>
        </header>

        {/* PROFILE SECTION */}
        <section className="space-y-4">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-[50px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner ring-4 ring-white/10">
                <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {(
                    profile?.full_name?.[0] ||
                    user.email?.[0] ||
                    "U"
                  ).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate pr-2">
                  {profile?.full_name ?? "Pengguna"}
                </h2>
                <p className="text-sm text-muted-foreground truncate font-medium">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIPTION STATUS */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-2">
            <Crown className="w-3 h-3 text-amber-500" />
            Status Langganan
          </h3>

          <div
            className={cn(
              "relative overflow-hidden rounded-[28px] border backdrop-blur-xl transition-all duration-500",
              isPremium
                ? "border-amber-500/30 bg-amber-500/5 shadow-[0_0_40px_-10px_rgba(245,158,11,0.2)]"
                : "border-white/10 bg-white/5",
            )}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold uppercase tracking-wider mb-1",
                      isPremium ? "text-amber-500" : "text-muted-foreground",
                    )}
                  >
                    {isPremium ? "Premium Active" : "Free Plan"}
                  </p>
                  <h4 className="text-2xl font-bold">
                    {isPremium ? "Akses Penuh" : "Dasar"}
                  </h4>
                </div>
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shadow-lg",
                    isPremium
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400",
                  )}
                >
                  {isPremium ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
              </div>

              {isPremium ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sisa waktu</span>
                      <span className="font-bold text-amber-500">
                        {formatRemainingFull(profile.active_until)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-amber-500/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, 100 - ((new Date(profile.active_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365)) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right pt-1">
                      Sampai {formatDateID(profile.active_until)}
                    </p>
                  </div>

                  <Button
                    asChild
                    className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-foreground border border-white/10 shadow-sm"
                  >
                    <Link href="/subscribe">Perpanjang Akses</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Upgrade ke Premium untuk membuka semua fitur eksklusif dan
                    pengalaman tanpa batas.
                  </p>
                  <Button
                    asChild
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 border-0"
                  >
                    <Link href="/subscribe">
                      <Crown className="w-4 h-4 mr-2 fill-current" />
                      Upgrade Sekarang
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PENDING CHECKOUT (Conditional) */}
        {pendingIntent && (
          <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 px-2 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Menunggu Pembayaran
            </h3>

            <div className="overflow-hidden rounded-[28px] border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-xl relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">
                      {joinName(pendingIntent)}
                    </h4>
                    <p className="text-xs text-indigo-500/80 font-medium mt-1">
                      Dibuat pada {formatDateID(pendingIntent.created_at)}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20">
                    PENDING
                  </span>
                </div>

                <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-4 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Tagihan
                  </span>
                  <span className="text-lg font-bold">
                    {formatIDR(Number(pendingIntent.final_price_idr))}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <div className="font-mono font-medium">
                    <PaymentCountdown expiresAt={pendingIntent.expires_at} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <form action={cancelPendingIntentAction} className="w-full">
                    <input
                      type="hidden"
                      name="intent_id"
                      value={pendingIntent.id}
                    />
                    <input type="hidden" name="next" value="/settings" />
                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full h-11 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    >
                      Batalkan
                    </Button>
                  </form>
                  <Button
                    asChild
                    className="w-full h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  >
                    <Link href={`/subscribe/pay?intent=${pendingIntent.id}`}>
                      Bayar
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MENU ACTIONS */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">
            Menu Akun
          </h3>

          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl divide-y divide-white/5">
            {/* Music Settings */}
            <Link
              href="/music"
              className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Musik Latar</p>
                  <p className="text-xs text-muted-foreground">
                    Atur playlist dan musik
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            {/* Billing History */}
            <Link
              href="/settings/billing"
              className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Riwayat Pembayaran</p>
                  <p className="text-xs text-muted-foreground">
                    Lihat transaksi sebelumnya
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            {/* Manage Subscription */}
            <Link
              href="/subscribe"
              className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Kelola Paket</p>
                  <p className="text-xs text-muted-foreground">
                    Upgrade atau ubah plan
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            {/* Logout */}
            <Link
              href="/logout"
              className="flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-red-500">Keluar</p>
                  <p className="text-xs text-red-500/60">
                    Logout dari sesi ini
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-500/50 group-hover:text-red-500 transition-colors" />
            </Link>
          </div>
        </section>

        {/* LAST PAYMENT INFO (Small) */}
        {lastPayment && (
          <div className="flex items-center justify-center gap-2 py-4 opacity-60">
            <Receipt className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Terakhir bayar: {formatIDR(Number(lastPayment.gross_amount))} •{" "}
              {formatDateID(lastPayment.paid_at ?? lastPayment.created_at)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
