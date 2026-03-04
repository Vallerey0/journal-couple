import { getActiveCouple, getArchivedCouples } from "@/lib/couples/queries";
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
    const archivedCouples = await getArchivedCouples();
    const hasArchivedCouple = archivedCouples.length > 0;

    return (
      <div className="space-y-4">
        {showSubscribeBanner && <SubscribeBanner />}
        <div className="px-4">
          <CoupleEmpty hasArchivedCouple={hasArchivedCouple} />
        </div>
      </div>
    );
  }

  /* ================= MAIN ================= */
  return (
    <div className="relative w-full">
      <div className="relative z-10 pt-2 space-y-6">
        {showSubscribeBanner && <SubscribeBanner />}
        <CoupleDashboard couple={couple} locked={!subscriptionAllowed} />
      </div>
    </div>
  );
}
