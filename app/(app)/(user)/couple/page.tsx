import { getActiveCouple } from "@/lib/couples/queries";
import { createClient } from "@/lib/supabase/server";
import { computePlanStatus } from "@/utils/plan";
import { Metadata } from "next";

import { SubscribeBanner } from "@/components/user/subscribe-banner";

export const metadata: Metadata = {
  title: "Dashboard",
};

import { CoupleEmpty } from "./_components/couple-empty";
import { CoupleDashboard } from "./_components/couple-dashboard";

export default async function CouplePage() {
  const supabase = await createClient();

  /* ================= AUTH ================= */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let subscriptionAllowed = false;
  let showSubscribeBanner = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_plan_id, active_until, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      const plan = computePlanStatus({
        current_plan_id: profile.current_plan_id,
        active_until: profile.active_until,
        trial_ends_at: profile.trial_ends_at,
      });

      subscriptionAllowed = plan.view === "premium" || plan.view === "trial";
      showSubscribeBanner = plan.showSubscribe;
    }
  }

  /* ================= DATA ================= */
  const couple = await getActiveCouple();

  /* ================= EMPTY ================= */
  if (!couple) {
    return (
      <div className="space-y-4 bg-gradient-to-b from-background to-muted/30">
        {showSubscribeBanner && <SubscribeBanner />}
        <div className="px-4">
          <CoupleEmpty />
        </div>
      </div>
    );
  }

  /* ================= MAIN ================= */
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 p-4 pb-10">
        {showSubscribeBanner && <SubscribeBanner />}
        <CoupleDashboard couple={couple} locked={!subscriptionAllowed} />
      </div>
    </div>
  );
}
