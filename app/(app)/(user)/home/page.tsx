import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/user/dashboard-header";
import { SubscribeBanner } from "@/components/user/subscribe-banner";
import { PlanStatus } from "@/components/user/plan-status";
import { PaymentNotice } from "@/components/user/payment-notice";
import { computePlanStatus } from "@/lib/plan";
import { createClient } from "@/utils/supabase/server";

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

  // ✅ ambil profile + join plan lewat FK current_plan_id
  const { data: profile, error } = await supabase
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
    `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <pre className="text-xs text-red-500">
        {JSON.stringify(error, null, 2)}
      </pre>
    );
  }

  const safeProfile = profile ?? {
    id: user.id,
    full_name: user.email ?? "User",
    active_until: null,
    trial_started_at: null,
    trial_ends_at: null,
    current_plan_id: null,
    subscription_plans: null as any,
  };

  const planName =
    (safeProfile as any)?.subscription_plans?.name ??
    (safeProfile.current_plan_id ? "Premium" : null);

  const { view, note, showSubscribe } = computePlanStatus({
    active_until: safeProfile.active_until,
    trial_ends_at: safeProfile.trial_ends_at,
    current_plan_id: safeProfile.current_plan_id,
  });

  const coupleName = safeProfile.full_name ?? user.email ?? "User";
  const shareUrl = `https://yourdomain.com/j/your-share-code`;

  return (
    <div className="space-y-4">
      <DashboardHeader
        title="Dashboard"
        subtitle={`Selamat datang, ${coupleName}`}
        initials={(coupleName?.[0] ?? "U").toUpperCase()}
      />

      {/* ✅ Notice pembayaran (tanpa alert) */}
      {sp.paid ? <PaymentNotice variant="success" /> : null}
      {sp.pending ? <PaymentNotice variant="pending" /> : null}
      {sp.pay_error ? <PaymentNotice variant="error" /> : null}

      <PlanStatus view={view} note={note} planName={planName} />

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
