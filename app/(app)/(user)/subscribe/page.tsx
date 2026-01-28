import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCheckoutIntentAction } from "./actions";
import { cancelPendingIntentAction } from "@/lib/cancel-intent-action";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
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
    .eq("new_customer_only", true);

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

  const pendingPlan = pendingIntent
    ? Array.isArray((pendingIntent as any).subscription_plans)
      ? (pendingIntent as any).subscription_plans[0]
      : (pendingIntent as any).subscription_plans
    : null;

  const pendingPlanName = pendingPlan?.name ?? "Plan";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Berlangganan</h1>
        <p className="text-sm text-muted-foreground">
          Pilih paket premium untuk membuka semua fitur.
        </p>

        {isNew ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Kamu terdeteksi sebagai user baru. Diskon otomatis akan muncul jika
            promo tersedia.
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Diskon user baru tidak berlaku karena akun ini sudah punya riwayat
            pembayaran/langganan.
          </p>
        )}
      </div>

      {pendingIntent ? (
        <Card className="gap-3 p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Ada pembayaran yang belum selesai
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Checkout terakhir: {pendingPlanName} •{" "}
              {formatIDR(Number(pendingIntent.final_price_idr ?? 0))} •{" "}
              {formatDateTimeID(pendingIntent.created_at)}
              {pendingIntent.coupon_code
                ? ` • Kupon ${pendingIntent.coupon_code}`
                : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button asChild className="w-full">
              <Link href={`/subscribe/pay?intent=${pendingIntent.id}`}>
                Lanjutkan pembayaran
              </Link>
            </Button>

            <Button asChild className="w-full" variant="outline">
              <a href="#plan">Ganti plan</a>
            </Button>

            <form action={cancelPendingIntentAction} className="sm:col-span-2">
              <input type="hidden" name="intent_id" value={pendingIntent.id} />
              <input type="hidden" name="next" value="/subscribe" />
              <Button type="submit" variant="ghost" className="w-full">
                Batalkan checkout
              </Button>
            </form>
          </div>
        </Card>
      ) : null}

      <form action={createCheckoutIntentAction} className="space-y-3">
        <Card className="p-4" id="plan">
          <p className="text-sm font-semibold">Pilih Plan</p>

          <div className="mt-3 grid gap-2">
            {safePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada plan aktif. Hubungi admin.
              </p>
            ) : (
              safePlans.map((p: any) => {
                const base = Number(p.price_idr ?? 0);
                const disc = discountMap.get(p.id) ?? 0;
                const discountAmount = Math.floor((base * disc) / 100);
                const final = Math.max(0, base - discountAmount);

                return (
                  <label
                    key={p.id}
                    className="flex items-start gap-3 rounded-xl border p-3"
                  >
                    <input
                      type="radio"
                      name="plan_id"
                      value={p.id}
                      required
                      className="mt-1"
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.duration_days} hari
                        </span>
                        {disc > 0 ? (
                          <span className="rounded-full border px-2 py-0.5 text-[11px]">
                            Diskon {disc}%
                          </span>
                        ) : null}
                      </div>

                      {disc > 0 ? (
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className="text-sm line-through text-muted-foreground">
                            {formatIDR(base)}
                          </span>
                          <span className="text-sm font-semibold">
                            {formatIDR(final)}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm">{formatIDR(base)}</p>
                      )}

                      {p.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold">Kode Kupon (opsional)</p>
          <p className="text-xs text-muted-foreground">
            Kupon dihitung saat checkout.
          </p>

          <input
            name="coupon"
            placeholder="Contoh: JOURNAL50"
            className="mt-3 w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
          />
        </Card>

        <Button className="w-full" type="submit">
          {pendingIntent ? "Buat Checkout Baru" : "Lanjut Pembayaran"}
        </Button>

        <p className="text-xs text-muted-foreground">
          {pendingIntent
            ? "Ini akan membuat checkout baru. Checkout sebelumnya akan otomatis kedaluwarsa."
            : "Setelah lanjut, kamu akan masuk halaman konfirmasi checkout."}
        </p>
      </form>
    </div>
  );
}
