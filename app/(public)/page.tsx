import HomeClient, { type SubscriptionPlan } from "./HomeClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PromoRow = {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  start_at: string;
  end_at: string | null;
  is_active: boolean;
  archived_at: string | null;
};

function isActiveWindow(startAt: string | null, endAt: string | null) {
  const now = Date.now();
  const s = new Date(startAt ?? "").getTime();
  const e = endAt ? new Date(endAt).getTime() : null;
  if (!Number.isFinite(s)) return false;
  if (s > now) return false;
  if (e !== null && Number.isFinite(e) && e <= now) return false;
  return true;
}

export default async function Home() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  const ctaHref = auth.user
    ? "/subscribe"
    : `/login?next=${encodeURIComponent("/subscribe")}`;

  const admin = createAdminClient();

  const { data: plans } = await admin
    .from("subscription_plans")
    .select(
      "id, code, name, price_idr, duration_days, description, is_active, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const safePlansRaw = (plans ?? []) as Array<{
    id: string;
    code: string;
    name: string;
    price_idr: number;
    duration_days: number;
    description: string | null;
    is_active: boolean;
    sort_order: number;
  }>;

  const { data: promos, error: promosErr } = await admin
    .from("promotions")
    .select(
      "id, name, description, discount_percent, start_at, end_at, is_active, archived_at",
    )
    .eq("is_active", true)
    .is("archived_at", null)
    .is("code", null);

  const activePromos = promosErr
    ? ([] as PromoRow[])
    : ((promos ?? []) as PromoRow[])
        .filter((p) => isActiveWindow(p.start_at, p.end_at))
        .sort(
          (a, b) =>
            Number(b.discount_percent ?? 0) - Number(a.discount_percent ?? 0),
        );

  const promoIds = activePromos.map((p) => p.id);
  const planIds = safePlansRaw.map((p) => p.id);

  const { data: piv } =
    promoIds.length > 0 && planIds.length > 0
      ? await admin
          .from("promotion_plans")
          .select("promotion_id, plan_id")
          .in("promotion_id", promoIds)
          .in("plan_id", planIds)
      : { data: [] as Array<{ promotion_id: string; plan_id: string }> };

  const applicable = new Set(
    (piv ?? []).map((r) => `${r.promotion_id}:${r.plan_id}`),
  );

  const safePlans = safePlansRaw.map((p) => {
    const base = Number(p.price_idr ?? 0);
    let promo: PromoRow | null = null;

    for (const pr of activePromos) {
      if (applicable.has(`${pr.id}:${p.id}`)) {
        promo = pr;
        break;
      }
    }

    const disc = promo ? Number(promo.discount_percent ?? 0) : 0;
    const discountAmount = disc > 0 ? Math.floor((base * disc) / 100) : 0;
    const final = Math.max(0, base - discountAmount);

    return {
      ...p,
      discount_percent: disc,
      discount_amount_idr: discountAmount,
      final_price_idr: final,
      promotion_name: promo?.name ?? null,
      promotion_description: promo?.description ?? null,
    };
  }) as SubscriptionPlan[];

  return <HomeClient plans={safePlans} ctaHref={ctaHref} />;
}
