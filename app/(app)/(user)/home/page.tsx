import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/user/dashboard-header";
import { SubscribeBanner } from "@/components/user/subscribe-banner";
import { PlanStatus } from "@/components/user/plan-status";
import { PaymentNotice } from "@/components/user/payment-notice";
import { PaymentCountdown } from "@/components/user/payment-countdown";
import { computePlanStatus } from "@/lib/plan";
import { createClient } from "@/utils/supabase/server";
import HomeAutoRefresh from "./HomeAutoRefresh";
import { cancelPendingIntentAction } from "@/lib/cancel-intent-action";

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
      <div className="text-sm">
        Kamu belum login.{" "}
        <Link className="underline" href="/login">
          Login
        </Link>
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
  const shareUrl = `${appUrl}/j/your-share-code`;

  return (
    <div className="space-y-4">
      {/* Auto refresh setelah webhook */}
      <HomeAutoRefresh
        paid={paid}
        pending={pending}
        activeUntil={safeProfile.active_until}
        currentPlanId={safeProfile.current_plan_id}
      />

      <DashboardHeader
        title="Dashboard"
        subtitle={`Selamat datang, ${coupleName}`}
        initials={(coupleName?.[0] ?? "U").toUpperCase()}
      />

      {paid && <PaymentNotice variant="success" />}
      {pending && <PaymentNotice variant="pending" />}
      {payError && <PaymentNotice variant="error" />}

      {/* ================= CTA PENDING PAYMENT (FIX UI SAJA) ================= */}
      {pendingIntent ? (
        <Card className="p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold">
              Ada pembayaran yang belum selesai
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Selesaikan pembayaran untuk mengaktifkan langganan kamu.
            </p>
          </div>

          {/* COUNTDOWN */}
          <PaymentCountdown expiresAt={pendingIntent.expires_at} />

          {/* TOMBOL TUMPUK TIGA (MOBILE FIRST) */}
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/subscribe/pay?intent=${pendingIntent.id}`}>
                Lanjutkan pembayaran
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/subscribe">Ganti plan / kupon</Link>
            </Button>

            <form action={cancelPendingIntentAction}>
              <input type="hidden" name="intent_id" value={pendingIntent.id} />
              <input type="hidden" name="next" value="/home" />
              <Button
                type="submit"
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                Batalkan checkout
              </Button>
            </form>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Batas waktu ini hanya untuk reservasi checkout. Pembayaran tetap
            diproses jika berhasil.
          </p>
        </Card>
      ) : null}

      {/* ================= PLAN STATUS ================= */}
      <PlanStatus
        view={view}
        note={note}
        activeUntil={safeProfile.active_until}
      />

      {/* ================= SUBSCRIBE BANNER ================= */}
      <SubscribeBanner
        show={showSubscribe}
        title={
          view === "expired" ? "Akun kamu tidak aktif" : "Upgrade ke Premium"
        }
        desc={
          view === "expired"
            ? "Langganan untuk membuka kembali semua fitur."
            : "Buka fitur eksklusif untuk journal & presentasi kamu."
        }
        cta={view === "expired" ? "Berlangganan" : "Subscribe"}
      />

      {/* ================= LINK JOURNAL ================= */}
      <Card className="p-4">
        <p className="text-sm font-medium">Link Journal</p>
        <p className="mt-1 break-all text-sm text-muted-foreground">
          {shareUrl}
        </p>

        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline">
            Copy
          </Button>
          <Button size="sm">Share</Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Journal View bentuknya presentasi (scroll-only).
        </p>
      </Card>

      {/* ================= QUICK STATS ================= */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Photos</p>
          <p className="mt-1 text-lg font-semibold">0</p>
          <Button asChild className="mt-3 w-full" variant="outline" size="sm">
            <Link href="/gallery">Kelola</Link>
          </Button>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Trips</p>
          <p className="mt-1 text-lg font-semibold">0</p>
          <Button asChild className="mt-3 w-full" variant="outline" size="sm">
            <Link href="/traveling">Kelola</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
