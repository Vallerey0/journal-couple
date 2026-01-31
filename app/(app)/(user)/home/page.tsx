import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/user/dashboard-header";
import { SubscribeBanner } from "@/components/user/subscribe-banner";
import { PlanStatus } from "@/components/user/plan-status";
import { PaymentNotice } from "@/components/user/payment-notice";
import { PaymentCountdown } from "@/components/user/payment-countdown";
import { computePlanStatus } from "@/utils/plan";
import { createClient } from "@/lib/supabase/server";
import HomeAutoRefresh from "./HomeAutoRefresh";
import { cancelPendingIntentAction } from "@/lib/cancel-intent-action";
import { getActiveCouple } from "@/lib/couples/queries";
import { SlugManager } from "@/components/user/slug-manager";
import { Image as ImageIcon, Clock, ChevronRight, Music } from "lucide-react";

type SP = {
  paid?: string;
  pending?: string;
  pay_error?: string;
};

export default async function UserHomePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const paid = sp.paid === "1";
  const pending = sp.pending === "1";
  const payError = sp.pay_error === "1";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-background">
        <div className="text-center space-y-4 relative z-10">
          <p className="text-muted-foreground">Sesi anda telah berakhir.</p>
          <Button
            asChild
            className="rounded-full px-8 h-12 text-base font-medium"
          >
            <Link href="/login">Login Kembali</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ================= PROFILE ================= */
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      active_until,
      trial_started_at,
      trial_ends_at,
      current_plan_id,
      subscription_plans:current_plan_id (
        id,
        name,
        code
      )
    `,
    )
    .eq("id", user.id)
    .maybeSingle();

  const couple = await getActiveCouple();

  /* ================= PENDING INTENT (VALID ONLY) ================= */
  const now = new Date().toISOString();

  const { data: pendingIntent } = await supabase
    .from("payment_intents")
    .select("id, expires_at")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const safeProfile = profile ?? {
    id: user.id,
    full_name: user.email ?? "User",
    active_until: null,
    trial_started_at: null,
    trial_ends_at: null,
    current_plan_id: null,
    subscription_plans: null as any,
  };

  const { view, note, showSubscribe } = computePlanStatus({
    active_until: safeProfile.active_until,
    trial_ends_at: safeProfile.trial_ends_at,
    current_plan_id: safeProfile.current_plan_id,
  });

  const coupleName = safeProfile.full_name ?? user.email ?? "User";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="relative w-full text-foreground selection:bg-pink-500/30">
      {/* ================= AMBIENT BACKGROUND ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blobs matching settings page style */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 space-y-6 pt-2">
        {/* Auto refresh logic */}
        <HomeAutoRefresh
          paid={paid}
          pending={pending}
          activeUntil={safeProfile.active_until}
          currentPlanId={safeProfile.current_plan_id}
        />

        {/* HEADER SECTION */}
        <div className="flex flex-col gap-1">
          <DashboardHeader
            title="Dashboard"
            subtitle={`Selamat datang, ${coupleName}`}
            initials={(coupleName?.[0] ?? "U").toUpperCase()}
          />
        </div>

        {/* NOTIFICATIONS */}
        <div className="space-y-4">
          {paid && <PaymentNotice variant="success" />}
          {pending && <PaymentNotice variant="pending" />}
          {payError && <PaymentNotice variant="error" />}
        </div>

        {/* ================= PLAN STATUS CARD ================= */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-[32px] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative rounded-[32px] bg-card/50 backdrop-blur-xl border border-border p-1">
            <PlanStatus
              view={view}
              note={note}
              activeUntil={safeProfile.active_until}
            />
          </div>
        </div>

        {/* ================= PENDING PAYMENT ALERT ================= */}
        {pendingIntent && (
          <div className="relative overflow-hidden rounded-[32px] border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 backdrop-blur-2xl p-6 shadow-2xl shadow-indigo-900/10 animate-in slide-in-from-bottom-5 fade-in duration-700">
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-100 tracking-tight">
                    Menunggu Pembayaran
                  </h3>
                  <p className="text-sm text-indigo-700/70 dark:text-indigo-200/70 mt-1 leading-relaxed">
                    Selesaikan pembayaran untuk membuka akses premium.
                  </p>
                </div>
              </div>

              <div className="bg-background/40 dark:bg-black/20 rounded-2xl p-4 border border-border/50 dark:border-white/5 mb-6 flex justify-center backdrop-blur-sm">
                <PaymentCountdown expiresAt={pendingIntent.expires_at} />
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/20 text-base font-semibold transition-all active:scale-[0.98]"
                >
                  <Link href={`/subscribe/pay?intent=${pendingIntent.id}`}>
                    Bayar Sekarang
                  </Link>
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-2xl border-border/50 bg-background/50 hover:bg-muted text-sm backdrop-blur-md transition-all active:scale-[0.98]"
                  >
                    <Link href="/subscribe">Ganti Plan</Link>
                  </Button>

                  <form action={cancelPendingIntentAction} className="w-full">
                    <input
                      type="hidden"
                      name="intent_id"
                      value={pendingIntent.id}
                    />
                    <input type="hidden" name="next" value="/home" />
                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full h-12 rounded-2xl text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-[0.98]"
                    >
                      Batalkan
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= QUICK ACTIONS GRID ================= */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <Link
            href="/gallery"
            className="group relative h-48 overflow-hidden rounded-[32px] border border-border bg-card/40 dark:bg-white/[0.03] backdrop-blur-2xl p-6 transition-all hover:bg-muted/50 dark:hover:bg-white/[0.06] active:scale-[0.98]"
          >
            {/* Gradient Orb */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full group-hover:bg-purple-500/30 transition-all duration-500" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-600 dark:text-purple-300 border border-border/50 dark:border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div className="p-2 rounded-full bg-muted/50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <ChevronRight className="w-4 h-4 text-muted-foreground dark:text-white/50" />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/40 uppercase tracking-widest mb-1">
                  Memories
                </p>
                <h4 className="text-xl font-bold text-foreground dark:text-white tracking-tight">
                  Gallery
                </h4>
              </div>
            </div>
          </Link>

          <Link
            href="/music"
            className="group relative h-48 overflow-hidden rounded-[32px] border border-border bg-card/40 dark:bg-white/[0.03] backdrop-blur-2xl p-6 transition-all hover:bg-muted/50 dark:hover:bg-white/[0.06] active:scale-[0.98]"
          >
            {/* Gradient Orb */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/30 transition-all duration-500" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 border border-border/50 dark:border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <Music className="w-7 h-7" />
                </div>
                <div className="p-2 rounded-full bg-muted/50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <ChevronRight className="w-4 h-4 text-muted-foreground dark:text-white/50" />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/40 uppercase tracking-widest mb-1">
                  Playlist
                </p>
                <h4 className="text-xl font-bold text-foreground dark:text-white tracking-tight">
                  Music
                </h4>
              </div>
            </div>
          </Link>
        </div>

        {/* ================= SUBSCRIBE BANNER ================= */}
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-purple-900/20 transform transition-all hover:scale-[1.01]">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 blur-xl" />
          <SubscribeBanner
            show={showSubscribe}
            title={view === "expired" ? "Akun Tidak Aktif" : "Upgrade Premium"}
            desc={
              view === "expired"
                ? "Aktifkan kembali untuk akses penuh."
                : "Buka fitur eksklusif journal & presentasi."
            }
            cta={view === "expired" ? "Aktifkan" : "Upgrade"}
          />
        </div>

        {/* ================= SHARE CARD (PREMIUM) ================= */}
        {couple && (
          <SlugManager
            coupleId={couple.id}
            initialSlug={couple.slug}
            baseUrl={appUrl}
          />
        )}
      </div>
    </div>
  );
}
