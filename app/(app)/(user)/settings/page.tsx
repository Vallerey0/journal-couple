import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { computePlanStatus } from "@/lib/plan";

export default async function SettingsPage() {
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "full_name, email, plan, active_until, trial_ends_at, subscription_status"
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
    full_name: user.email ?? "User",
    email: user.email,
    plan: null,
    active_until: null,
    trial_ends_at: null,
    subscription_status: "inactive",
  };

  const status = computePlanStatus({
    plan: safeProfile.plan,
    active_until: safeProfile.active_until,
    trial_ends_at: safeProfile.trial_ends_at,
    subscription_status: safeProfile.subscription_status,
  });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm font-medium">Akun</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {safeProfile.full_name}
        </p>
        <p className="text-sm text-muted-foreground">{safeProfile.email}</p>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-medium">Status Langganan</p>
        <p className="mt-1 text-sm text-muted-foreground">{status.note}</p>

        <div className="mt-3">
          <Button asChild>
            <Link href="/subscribe">
              {status.showSubscribe ? "Berlangganan" : "Kelola Langganan"}
            </Link>
          </Button>
        </div>
      </Card>

      {/* nanti: theme toggle, logout, privacy, dsb */}
    </div>
  );
}
