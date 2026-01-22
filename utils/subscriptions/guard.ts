import "server-only";
import { createClient } from "@/utils/supabase/server";

const GRACE_PERIOD_HOURS = 24;

export type SubscriptionGuardResult =
  | { allowed: true; trial?: boolean; grace?: boolean; remainingHours?: number }
  | { allowed: false };

export async function requireActiveSubscription(): Promise<SubscriptionGuardResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_plan_id, active_until, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { allowed: false };
  }

  const now = Date.now();

  const activeUntilTs = profile.active_until
    ? new Date(profile.active_until).getTime()
    : null;

  const trialEndsTs = profile.trial_ends_at
    ? new Date(profile.trial_ends_at).getTime()
    : null;

  // ✅ PREMIUM
  if (profile.current_plan_id && activeUntilTs && activeUntilTs > now) {
    return { allowed: true };
  }

  // ⚠️ TRIAL
  if (trialEndsTs && trialEndsTs > now) {
    return { allowed: true, trial: true };
  }

  // ⚠️ GRACE PERIOD
  if (activeUntilTs) {
    const diffHours = (now - activeUntilTs) / (1000 * 60 * 60);

    if (diffHours <= GRACE_PERIOD_HOURS) {
      return {
        allowed: true,
        grace: true,
        remainingHours: Math.ceil(GRACE_PERIOD_HOURS - diffHours),
      };
    }
  }

  return { allowed: false };
}
