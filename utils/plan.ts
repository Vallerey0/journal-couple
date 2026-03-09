import { formatDateID, formatRemainingFull } from "@/utils/duration";

/* ================= TYPES ================= */
export type PlanView = "premium" | "trial" | "expired";

type Input = {
  active_until: string | null;
  trial_ends_at: string | null;
  current_plan_id: string | null;
};

export function computePlanStatus(input: Input) {
  const now = Date.now();

  const activeUntilTs = input.active_until
    ? new Date(input.active_until).getTime()
    : null;

  const trialEndsTs = input.trial_ends_at
    ? new Date(input.trial_ends_at).getTime()
    : null;

  // PREMIUM jika ada plan + active_until masih di depan
  const isPremium =
    !!input.current_plan_id && !!activeUntilTs && activeUntilTs > now;

  if (isPremium) {
    return {
      view: "premium" as PlanView,
      title: "PREMIUM",
      note: "Akun premium aktif",
      untilText: `Aktif sampai ${formatDateID(input.active_until!)}`,
      remainingText: `Sisa ${formatRemainingFull(input.active_until!)}`,
      showSubscribe: false,
    };
  }

  // TRIAL jika tidak ada plan tapi active_until masih hidup (atau trial_ends_at)
  // User minta spesifik cek active_until untuk 7 hari trial
  const isTrial =
    !input.current_plan_id &&
    ((!!activeUntilTs && activeUntilTs > now) ||
      (!!trialEndsTs && trialEndsTs > now));

  if (isTrial) {
    // Prioritas gunakan active_until jika ada, fallback ke trial_ends_at
    const endParams = input.active_until ?? input.trial_ends_at!;

    return {
      view: "trial" as PlanView,
      title: "TRIAL",
      note: "Kamu sedang menggunakan trial",
      untilText: `Trial sampai ${formatDateID(endParams)}`,
      remainingText: `Sisa ${formatRemainingFull(endParams)}`,
      showSubscribe: true,
    };
  }

  // EXPIRED
  return {
    view: "expired" as PlanView,
    title: "EXPIRED",
    note: "Akun kamu tidak aktif. Langganan sekarang untuk mengakses kembali.",
    untilText: "Akun kamu tidak aktif",
    remainingText: "Langganan untuk membuka kembali semua fitur.",
    showSubscribe: true,
  };
}
