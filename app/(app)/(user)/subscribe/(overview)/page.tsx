import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SubscribeForm, { PlanWithPricing } from "../SubscribeForm";

// Client component wrapper for the cancel button logic
import { CancelPaymentButton } from "@/app/(app)/(user)/subscribe/_components/cancel-payment-button";

export function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateTimeID(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function isActiveWindow(startAt: string | null, endAt: string | null) {
  const now = Date.now();
  const s = startAt ? new Date(startAt).getTime() : null;
  const e = endAt ? new Date(endAt).getTime() : null;
  if (s && s > now) return false;
  if (e && e <= now) return false;
  return true;
}

type PromoRow = {
  id: string;
  discount_percent: number;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  archived_at: string | null;
  new_customer_only: boolean;
  max_redemptions: number | null;
  max_redemptions_per_user: number | null;
};

// minimal typings supaya gak any
type AdminClient = ReturnType<typeof createAdminClient>;

async function isNewCustomer(admin: AdminClient, userId: string) {
  const [{ count: paidCount }, { count: subCount }] = await Promise.all([
    admin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "paid"),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return (paidCount ?? 0) === 0 && (subCount ?? 0) === 0;
}

async function promoApplicable(
  admin: AdminClient,
  promoId: string,
  planId: string,
) {
  const { data } = await admin
    .from("promotion_plans")
    .select("promotion_id, plan_id")
    .eq("promotion_id", promoId)
    .eq("plan_id", planId)
    .maybeSingle();

  return !!data;
}

async function canRedeem(admin: AdminClient, promo: PromoRow, userId: string) {
  if (promo.max_redemptions) {
    const { count } = await admin
      .from("promotion_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promotion_id", promo.id);

    if ((count ?? 0) >= promo.max_redemptions) return false;
  }

  const perUser = promo.max_redemptions_per_user ?? 1;
  if (perUser > 0) {
    const { count } = await admin
      .from("promotion_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promotion_id", promo.id)
      .eq("user_id", userId);

    if ((count ?? 0) >= perUser) return false;
  }

  return true;
}

export default async function SubscribePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  // ✅ guard dulu, baru bikin userId yang pasti string
  if (!auth.user?.id) {
    return (
      <div className="text-sm">
        Kamu belum login.{" "}
        <Link className="underline" href="/login">
          Login
        </Link>
      </div>
    );
  }

  const userId = auth.user.id;

  const admin = createAdminClient();

  // plans aktif
  const { data: plans, error: plansErr } = await admin
    .from("subscription_plans")
    .select(
      "id, name, price_idr, duration_days, description, is_active, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (plansErr) {
    return (
      <pre className="text-xs text-red-500">
        {JSON.stringify(plansErr, null, 2)}
      </pre>
    );
  }

  const safePlans = plans ?? [];

  const { data: pendingIntent } = await admin
    .from("payment_intents")
    .select(
      `
      id,
      plan_id,
      final_price_idr,
      coupon_code,
      created_at,
      subscription_plans:plan_id ( name )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // preview promo auto new customer (tanpa kupon)
  const isNew = await isNewCustomer(admin, userId);

  const { data: promos } = await admin
    .from("promotions")
    .select(
      "id, discount_percent, start_at, end_at, is_active, archived_at, new_customer_only, max_redemptions, max_redemptions_per_user",
    )
    .eq("is_active", true)
    .is("archived_at", null)
    .eq("new_customer_only", true)
    .is("code", null);

  const activePromos = (promos ?? [])
    .filter((p: any) => isActiveWindow(p.start_at, p.end_at))
    .sort(
      (a: any, b: any) => (b.discount_percent ?? 0) - (a.discount_percent ?? 0),
    ) as PromoRow[];

  async function bestDiscountForPlan(planId: string): Promise<number> {
    if (!isNew) return 0;

    for (const p of activePromos) {
      const okPlan = await promoApplicable(admin, p.id, planId);
      if (!okPlan) continue;

      // ✅ userId sudah pasti string, jadi TS gak merah
      const okQuota = await canRedeem(admin, p, userId);
      if (!okQuota) continue;

      return Number(p.discount_percent ?? 0);
    }

    return 0;
  }

  // precompute diskon per plan (supaya UI ga nunggu per map)
  const discountMap = new Map<string, number>();
  for (const p of safePlans) {
    discountMap.set(p.id, await bestDiscountForPlan(p.id));
  }

  const plansWithPricing: PlanWithPricing[] = safePlans.map((p: any) => {
    const base = Number(p.price_idr ?? 0);
    const disc = discountMap.get(p.id) ?? 0;
    const discountAmount = Math.floor((base * disc) / 100);
    const final = Math.max(0, base - discountAmount);

    return {
      id: p.id,
      name: p.name,
      duration_days: p.duration_days,
      description: p.description,
      base_price: base,
      final_price: final,
      discount_percent: disc,
      discount_amount: discountAmount,
    };
  });

  const pendingPlan = pendingIntent
    ? Array.isArray((pendingIntent as any).subscription_plans)
      ? (pendingIntent as any).subscription_plans[0]
      : (pendingIntent as any).subscription_plans
    : null;

  const pendingPlanName = pendingPlan?.name ?? "Plan";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-0 py-8 max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-3xl sm:text-4xl font-bold text-transparent">
            Pilih Paket Premium
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Nikmati fitur tanpa batas dan abadikan setiap momen indah kalian.
          </p>

          {isNew ? (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                ✨ Penawaran Pengguna Baru Tersedia
              </span>
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-500/10 border border-zinc-500/20 backdrop-blur-sm">
              <span className="text-xs text-muted-foreground">
                Diskon pengguna baru tidak berlaku
              </span>
            </div>
          )}
        </div>

        {pendingIntent ? (
          <Card className="overflow-hidden border-orange-200/50 bg-white/60 shadow-xl shadow-orange-500/5 backdrop-blur-xl dark:border-orange-500/20 dark:bg-zinc-900/60">
            <div className="bg-orange-500/10 px-6 py-4 border-b border-orange-500/10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                  Menunggu Pembayaran
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Paket Terpilih
                </p>
                <div className="flex justify-between items-baseline mt-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {pendingPlanName}
                  </h3>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {formatIDR(Number(pendingIntent.final_price_idr ?? 0))}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>
                    Dibuat: {formatDateTimeID(pendingIntent.created_at)}
                  </span>
                  {pendingIntent.coupon_code && (
                    <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                      Kupon: {pendingIntent.coupon_code}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                <Button
                  asChild
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:scale-[1.02]"
                >
                  <Link href={`/subscribe/pay?intent=${pendingIntent.id}`}>
                    Lanjutkan Pembayaran
                  </Link>
                </Button>

                <CancelPaymentButton intentId={pendingIntent.id} />
              </div>
            </div>
          </Card>
        ) : null}

        <SubscribeForm
          plans={plansWithPricing}
          hasPendingIntent={!!pendingIntent}
        />
      </div>
    </div>
  );
}
