export type PlanView = "premium" | "trial" | "expired";

export function formatDateID(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function daysLeft(to: Date, from = new Date()) {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function computePlanStatus(profile: {
  plan: string | null;
  active_until: string | null;
  trial_ends_at: string | null;
  subscription_status: string | null;
}): { view: PlanView; note: string; showSubscribe: boolean } {
  const now = new Date();

  const activeUntil = profile.active_until
    ? new Date(profile.active_until)
    : null;

  const trialEnds = profile.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null;

  const plan = (profile.plan ?? "").toLowerCase().trim();
  const subStatus = (profile.subscription_status ?? "").toLowerCase().trim();

  // ✅ RULE 1: kalau plan = trial, maka status TRIAL/EXPIRED saja (tidak boleh jadi premium)
  if (plan === "trial") {
    const trialActive = !!trialEnds && trialEnds.getTime() > now.getTime();

    if (trialActive) {
      const left = daysLeft(trialEnds!, now);
      return {
        view: "trial",
        note: `Trial • ${left} hari lagi`,
        showSubscribe: true,
      };
    }

    return {
      view: "expired",
      note: "Tidak aktif / expired",
      showSubscribe: true,
    };
  }

  // ✅ RULE 2: premium hanya sah kalau plan = premium + status active + active_until valid
  const premiumActive =
    plan === "premium" &&
    subStatus === "active" &&
    !!activeUntil &&
    activeUntil.getTime() > now.getTime();

  if (premiumActive) {
    return {
      view: "premium",
      note: `Aktif sampai ${formatDateID(activeUntil!)}`,
      showSubscribe: false,
    };
  }

  // ✅ default
  return {
    view: "expired",
    note: "Tidak aktif / expired",
    showSubscribe: true,
  };
}
