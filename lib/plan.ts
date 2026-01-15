export type PlanView = "premium" | "trial" | "expired";

function fmtDateID(v: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(v);
}

function diffDaysCeil(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function computePlanStatus(input: {
  current_plan_id: string | null;
  active_until: string | null;
  trial_ends_at: string | null;
}): { view: PlanView; note: string; showSubscribe: boolean } {
  const now = new Date();

  // ✅ Premium valid kalau:
  // - ada current_plan_id
  // - active_until ada & masih di masa depan
  const activeUntil = input.active_until ? new Date(input.active_until) : null;
  const hasPremium =
    !!input.current_plan_id &&
    !!activeUntil &&
    activeUntil.getTime() > now.getTime();

  if (hasPremium) {
    const d = diffDaysCeil(now, activeUntil!);
    const note =
      d <= 1 ? `Berakhir ${fmtDateID(activeUntil!)}` : `Sisa ${d} hari`;
    return { view: "premium", note, showSubscribe: false };
  }

  // ✅ Trial valid kalau:
  // - belum premium
  // - trial_ends_at ada & masih di masa depan
  const trialEnds = input.trial_ends_at ? new Date(input.trial_ends_at) : null;
  const hasTrial = !!trialEnds && trialEnds.getTime() > now.getTime();

  if (hasTrial) {
    const d = diffDaysCeil(now, trialEnds!);
    const note =
      d <= 1
        ? `Trial berakhir ${fmtDateID(trialEnds!)}`
        : `Trial sisa ${d} hari`;
    return { view: "trial", note, showSubscribe: true };
  }

  // ✅ selain itu: expired
  return {
    view: "expired",
    note: "Tidak ada paket aktif",
    showSubscribe: true,
  };
}
