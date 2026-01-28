import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  createPlanAction,
  updatePlanAction,
  togglePlanActiveAction,
  createPromotionAction,
  updatePromotionAction,
  archivePromotionAction,
} from "./actions";
import PromotionEditForm from "./PromotionEditForm";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(n);
}

function fmtDate(v: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d);
}

function fmtRange(start: string | null, end: string | null) {
  const a = fmtDate(start);
  if (!end) return `${a} → Unlimited`;
  return `${a} → ${fmtDate(end)}`;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-muted-foreground">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border bg-transparent px-3 py-2 text-sm " +
        (props.className ?? "")
      }
    />
  );
}

function nowJakartaDatetimeLocal() {
  const dtf = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
    "minute",
  )}`;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const view = sp.view === "archived" ? "archived" : "active";

  const supabase = await createClient();

  const { data: plans, error: plansErr } = await supabase
    .from("subscription_plans")
    .select(
      "id, code, name, price_idr, duration_days, is_active, sort_order, description, created_at",
    )
    .order("sort_order", { ascending: true });

  const promoQuery = supabase
    .from("promotions")
    .select(
      "id, name, description, code, discount_percent, start_at, end_at, is_active, new_customer_only, max_redemptions, archived_at, created_at",
    )
    .order("created_at", { ascending: false });

  const { data: promos, error: promosErr } =
    view === "archived"
      ? await promoQuery.not("archived_at", "is", null)
      : await promoQuery.is("archived_at", null);

  if (plansErr || promosErr) {
    return (
      <pre className="text-xs text-red-500">
        {JSON.stringify({ plansErr, promosErr }, null, 2)}
      </pre>
    );
  }

  const safePlans = plans ?? [];
  const safePromos = promos ?? [];
  const startDefault = nowJakartaDatetimeLocal();

  // pivot untuk semua promo yang sedang tampil
  const promoIds = safePromos.map((p) => p.id);

  const { data: piv } =
    promoIds.length > 0
      ? await supabase
          .from("promotion_plans")
          .select("promotion_id, plan_id")
          .in("promotion_id", promoIds)
      : { data: [] as any[] };

  const pivotMap = new Map<string, string[]>();
  (piv ?? []).forEach((r: any) => {
    const arr = pivotMap.get(r.promotion_id) ?? [];
    arr.push(r.plan_id);
    pivotMap.set(r.promotion_id, arr);
  });

  // usedCount per promo (untuk lock edit)
  const usedMap = new Map<string, number>();
  for (const pid of promoIds) {
    const { count } = await supabase
      .from("promotion_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promotion_id", pid);

    usedMap.set(pid, count ?? 0);
  }

  // ✅ helper conflict: plan mana yang sudah punya promo aktif (selain promo ini)
  async function buildDisabledPlansForEdit(promoId: string) {
    const msgMap: Record<string, string> = {};
    const ids: string[] = [];

    // ambil promo aktif (yang bukan archived) + pivotnya
    const { data: activePromos } = await supabase
      .from("promotions")
      .select("id, name, archived_at")
      .is("archived_at", null);

    const activeIds = (activePromos ?? [])
      .map((p: any) => p.id)
      .filter((id: string) => id !== promoId);

    if (activeIds.length === 0) return { ids, msgMap };

    const { data: piv2 } = await supabase
      .from("promotion_plans")
      .select("promotion_id, plan_id")
      .in("promotion_id", activeIds);

    const planToPromo = new Map<string, { promotion_id: string }>();
    (piv2 ?? []).forEach((r: any) => {
      // kalau 1 plan sudah punya promo aktif lain, kunci
      if (!planToPromo.has(r.plan_id)) {
        planToPromo.set(r.plan_id, { promotion_id: r.promotion_id });
      }
    });

    for (const [planId, info] of planToPromo.entries()) {
      ids.push(planId);
      const promoName =
        (activePromos ?? []).find((p: any) => p.id === info.promotion_id)
          ?.name ?? "promo lain";
      msgMap[planId] =
        `Plan ini masih punya promo aktif: "${promoName}". Archive/akhiri promo itu dulu.`;
    }

    return { ids, msgMap };
  }

  // ✅ helper conflict untuk CREATE:
  // kunci plan yang sudah punya promo aktif.
  const { data: activePromoIdsRaw } = await supabase
    .from("promotions")
    .select("id")
    .is("archived_at", null);

  const activePromoIds = (activePromoIdsRaw ?? []).map((x: any) => x.id);

  const { data: activePiv } =
    activePromoIds.length > 0
      ? await supabase
          .from("promotion_plans")
          .select("promotion_id, plan_id")
          .in("promotion_id", activePromoIds)
      : { data: [] as any[] };

  const lockedPlanIdSet = new Set<string>();
  (activePiv ?? []).forEach((r: any) => lockedPlanIdSet.add(r.plan_id));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Plan bebas. Promo wajib pilih plan. Jika promo sudah dipakai, edit
          pivot plan dikunci. Promo bisa di-archive.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ===================== PLANS ===================== */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Plans</p>
            <span className="text-xs text-muted-foreground">
              {safePlans.length} plan
            </span>
          </div>

          <form action={createPlanAction} className="mt-4 grid gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label>Nama Plan</Label>
                <Input name="name" placeholder="Premium 1 Bulan" required />
              </div>

              <div className="grid gap-1">
                <Label>Harga (IDR)</Label>
                <Input
                  name="price_idr"
                  placeholder="50000"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="grid gap-1">
                <Label>Durasi (hari)</Label>
                <Input
                  name="duration_days"
                  placeholder="30"
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="grid gap-1">
                <Label>Urutan</Label>
                <Input
                  name="sort_order"
                  placeholder="1"
                  inputMode="numeric"
                  defaultValue="0"
                />
              </div>

              <div className="grid gap-1">
                <Label>Code (otomatis)</Label>
                <Input disabled value="Auto-generate" className="opacity-70" />
              </div>
            </div>

            <div className="grid gap-1">
              <Label>Deskripsi (opsional)</Label>
              <Input
                name="description"
                placeholder="Akses premium 30 hari (journal + presentasi)"
              />
            </div>

            <Button className="w-full" type="submit">
              Tambah Plan
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            {safePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada plan.</p>
            ) : (
              safePlans.map((p: any) => (
                <div key={p.id} className="rounded-xl border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{p.name}</span>
                        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                          {p.code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            p.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {p.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatIDR(p.price_idr)} • {p.duration_days} hari •
                        urutan {p.sort_order}
                      </p>
                    </div>

                    <form action={togglePlanActiveAction} className="shrink-0">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="next_active"
                        value={p.is_active ? "0" : "1"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {p.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </form>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Edit Plan
                    </summary>

                    <form action={updatePlanAction} className="mt-3 grid gap-3">
                      <input type="hidden" name="id" value={p.id} />

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="grid gap-1">
                          <Label>Nama</Label>
                          <Input name="name" defaultValue={p.name} required />
                        </div>

                        <div className="grid gap-1">
                          <Label>Harga (IDR)</Label>
                          <Input
                            name="price_idr"
                            inputMode="numeric"
                            defaultValue={String(p.price_idr)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="grid gap-1">
                          <Label>Durasi (hari)</Label>
                          <Input
                            name="duration_days"
                            inputMode="numeric"
                            defaultValue={String(p.duration_days)}
                            required
                          />
                        </div>

                        <div className="grid gap-1">
                          <Label>Urutan</Label>
                          <Input
                            name="sort_order"
                            inputMode="numeric"
                            defaultValue={String(p.sort_order ?? 0)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-1">
                        <Label>Deskripsi</Label>
                        <Input
                          name="description"
                          defaultValue={p.description ?? ""}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        Simpan Perubahan Plan
                      </Button>

                      <p className="text-[11px] text-muted-foreground">
                        Code plan tidak diubah (stabil).
                      </p>
                    </form>
                  </details>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* ===================== PROMOTIONS ===================== */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Promotions</p>

            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/admin/subscriptions?view=active"
                className={`rounded-full border px-3 py-1 ${
                  view === "active" ? "bg-muted" : "text-muted-foreground"
                }`}
              >
                Active
              </Link>
              <Link
                href="/admin/subscriptions?view=archived"
                className={`rounded-full border px-3 py-1 ${
                  view === "archived" ? "bg-muted" : "text-muted-foreground"
                }`}
              >
                Archived
              </Link>
            </div>
          </div>

          {view === "active" ? (
            <form action={createPromotionAction} className="mt-4 grid gap-3">
              <div className="grid gap-1">
                <Label>Nama Promo</Label>
                <Input name="name" placeholder="Early Bird 50%" required />
              </div>

              <div className="grid gap-1">
                <Label>Deskripsi (opsional)</Label>
                <Input
                  name="description"
                  placeholder="Promo 500 user pertama"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label>Kode Kupon (opsional)</Label>
                  <Input name="code" placeholder="JOURNAL50" />
                </div>

                <div className="grid gap-1">
                  <Label>Diskon (%)</Label>
                  <Input
                    name="discount_percent"
                    placeholder="50"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label>Mulai (start)</Label>
                  <Input
                    name="start_at"
                    type="datetime-local"
                    required
                    defaultValue={startDefault}
                  />
                </div>

                <div className="grid gap-1">
                  <Label>Berakhir (end) — opsional</Label>
                  <Input name="end_at" type="datetime-local" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                  <input
                    name="new_customer_only"
                    type="checkbox"
                    defaultChecked
                  />
                  <span>User baru saja</span>
                </label>

                <div className="grid gap-1">
                  <Label>Kuota (max redemptions)</Label>
                  <Input
                    name="max_redemptions"
                    placeholder="500 (kosong = unlimited)"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* ✅ plan picker create (wajib) */}
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">
                  Pilih plan yang mendapatkan promo (wajib minimal 1).
                </p>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {safePlans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tambahkan plan dulu.
                    </p>
                  ) : (
                    safePlans.map((p: any) => {
                      const locked = lockedPlanIdSet.has(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 text-sm ${
                            locked ? "opacity-50" : ""
                          }`}
                          title={
                            locked
                              ? "Plan ini sudah punya promo aktif. Archive/akhiri promo itu dulu."
                              : ""
                          }
                        >
                          <input
                            type="checkbox"
                            name="plan_id"
                            value={p.id}
                            disabled={locked}
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>

                <p className="mt-2 text-[11px] text-muted-foreground">
                  Plan yang sudah punya promo aktif akan dikunci agar promo
                  tidak bertabrakan.
                </p>
              </div>

              <Button className="w-full" type="submit">
                Tambah Promo
              </Button>

              <p className="text-[11px] text-muted-foreground">
                Jika promo sudah dipakai, edit pivot plan akan dikunci.
              </p>
            </form>
          ) : (
            <div className="mt-4 rounded-xl border p-3 text-sm text-muted-foreground">
              Archived promos bersifat historis (tidak dipakai lagi). Di sini
              hanya untuk audit.
            </div>
          )}

          <div className="mt-4 space-y-2">
            {safePromos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {view === "archived"
                  ? "Tidak ada promo archived."
                  : "Belum ada promo aktif."}
              </p>
            ) : (
              safePromos.map(async (x: any) => {
                const usedCount = usedMap.get(x.id) ?? 0;
                const used = usedCount > 0;

                const planCount = pivotMap.get(x.id)?.length ?? 0;
                const planList = `${planCount} plan(s)`;

                const { ids: disabledPlanIds, msgMap } =
                  await buildDisabledPlansForEdit(x.id);

                return (
                  <div key={x.id} className="rounded-xl border p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">
                            {x.name}
                          </span>

                          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                            {x.discount_percent}% OFF
                          </span>

                          {x.code ? (
                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                              COUPON: {x.code}
                            </span>
                          ) : (
                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                              AUTO
                            </span>
                          )}

                          {used ? (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                              USED {usedCount}
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                              UNUSED
                            </span>
                          )}

                          {view === "archived" ? (
                            <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                              ARCHIVED
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {fmtRange(x.start_at, x.end_at)} •{" "}
                          {x.new_customer_only
                            ? "New customer only"
                            : "All users"}{" "}
                          •{" "}
                          {x.max_redemptions
                            ? `Kuota ${x.max_redemptions}`
                            : "Unlimited"}{" "}
                          • {planList}
                        </p>

                        {x.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {x.description}
                          </p>
                        ) : null}
                      </div>

                      {view === "active" ? (
                        <form
                          action={archivePromotionAction}
                          className="shrink-0"
                        >
                          <input type="hidden" name="id" value={x.id} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            Archive
                          </Button>
                        </form>
                      ) : null}
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        {view === "archived"
                          ? "Lihat Detail (read-only)"
                          : "Edit Promo"}
                      </summary>

                      <PromotionEditForm
                        promo={{
                          id: x.id,
                          name: x.name,
                          description: x.description,
                          code: x.code,
                          discount_percent: x.discount_percent,
                          new_customer_only: x.new_customer_only,
                          max_redemptions: x.max_redemptions,
                          archived_at: x.archived_at,
                          used,
                          usedCount,
                        }}
                        plans={safePlans.map((p: any) => ({
                          id: p.id,
                          name: p.name,
                        }))}
                        initialPlanIds={pivotMap.get(x.id) ?? []}
                        disabledPlanIds={disabledPlanIds}
                        disabledPlanMessageMap={msgMap}
                        action={updatePromotionAction}
                      />
                    </details>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
