"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CenterToast, useCenterToast } from "@/components/admin/CenterToast";

type Plan = { id: string; name: string };

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

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-muted-foreground">{children}</label>;
}

function toIntSafe(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export default function PromotionCreateForm({
  plans,
  disabledAll,
  disabledAllMessage,
  disabledPlanIds,
  disabledPlanMessageMap,
  action,
  startDefault,
}: {
  plans: Plan[];
  disabledAll: boolean;
  disabledAllMessage: string;
  disabledPlanIds: string[];
  disabledPlanMessageMap: Record<string, string>;
  action: (formData: FormData) => void;
  startDefault: string;
}) {
  const { msg, show } = useCenterToast();

  // controlled fields (biar gak hilang)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("50");
  const [startAt, setStartAt] = useState(startDefault);
  const [endAt, setEndAt] = useState("");
  const [newCustomerOnly, setNewCustomerOnly] = useState(true);

  // ✅ kuota total
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");

  // plan selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );

  const discountNum = useMemo(() => toIntSafe(discount), [discount]);
  const discountOk = discountNum >= 1 && discountNum <= 100;

  const maxRedNum = useMemo(() => {
    const v = maxRedemptions.trim();
    if (!v) return null; // unlimited
    const n = toIntSafe(v);
    return Number.isFinite(n) ? n : NaN;
  }, [maxRedemptions]);

  const maxRedOk =
    maxRedNum === null || (Number.isFinite(maxRedNum) && maxRedNum > 0);

  const requiredOk =
    name.trim().length > 0 &&
    discountOk &&
    startAt.trim().length > 0 &&
    selectedIds.length > 0 &&
    maxRedOk;

  const canSubmit = !disabledAll && requiredOk;

  function onPlanClick(planId: string) {
    if (disabledAll) {
      show(disabledAllMessage || "Tidak bisa membuat promo saat ini.");
      return;
    }

    const isDisabled = disabledPlanIds.includes(planId);
    if (isDisabled) {
      show(
        disabledPlanMessageMap[planId] || "Plan ini sedang tidak bisa dipilih."
      );
      return;
    }

    setSelected((s) => ({ ...s, [planId]: !s[planId] }));
  }

  return (
    <>
      <CenterToast message={msg} />

      <form
        action={(fd) => {
          // ✅ jangan submit kalau belum valid
          if (!canSubmit) return;

          // push plan_id
          for (const id of selectedIds) fd.append("plan_id", id);

          // checkbox
          if (newCustomerOnly) fd.set("new_customer_only", "on");

          // kuota total
          const v = maxRedemptions.trim();
          if (v) fd.set("max_redemptions", v);
          else fd.set("max_redemptions", ""); // biar action treat null

          action(fd);
        }}
        className="mt-4 grid gap-3"
      >
        {disabledAll ? (
          <div className="rounded-xl border bg-muted p-3 text-sm text-muted-foreground">
            {disabledAllMessage ||
              "Tidak bisa membuat promo baru karena masih ada promo global aktif."}
          </div>
        ) : null}

        <div className="grid gap-1">
          <Label>Nama Promo</Label>
          <Input
            name="name"
            placeholder="Early Bird 50%"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabledAll}
            required
          />
        </div>

        <div className="grid gap-1">
          <Label>Deskripsi (opsional)</Label>
          <Input
            name="description"
            placeholder="Promo 500 user pertama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabledAll}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label>Kode Kupon (opsional)</Label>
            <Input
              name="code"
              placeholder="JOURNAL50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={disabledAll}
            />
          </div>

          <div className="grid gap-1">
            <Label>Diskon (%)</Label>
            <Input
              name="discount_percent"
              placeholder="50"
              inputMode="numeric"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              disabled={disabledAll}
              required
            />
            {!discountOk ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Diskon harus 1–100.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label>Mulai (start)</Label>
            <Input
              name="start_at"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              disabled={disabledAll}
              required
            />
          </div>

          <div className="grid gap-1">
            <Label>Berakhir (end) — opsional</Label>
            <Input
              name="end_at"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              disabled={disabledAll}
            />
          </div>
        </div>

        {/* ✅ Kuota total */}
        <div className="grid gap-1">
          <Label>Kuota pemakaian (max users) — opsional</Label>
          <Input
            name="max_redemptions"
            placeholder="Contoh: 500 (kosong = unlimited)"
            inputMode="numeric"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            disabled={disabledAll}
          />
          {!maxRedOk ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Kuota harus angka &gt; 0 (atau kosong untuk unlimited).
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Ini batas total pemakaian promo. Default per user tetap 1 (aman).
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <input
            name="new_customer_only"
            type="checkbox"
            checked={newCustomerOnly}
            onChange={(e) => setNewCustomerOnly(e.target.checked)}
            disabled={disabledAll}
          />
          <span>User baru saja (belum pernah subscription)</span>
        </label>

        {/* ✅ Plan picker wajib */}
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">
            Pilih plan yang mendapatkan promo (wajib minimal 1).
          </p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tambahkan plan dulu.
              </p>
            ) : (
              plans.map((p) => {
                const conflictDisabled = disabledPlanIds.includes(p.id);
                const checked = !!selected[p.id];

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPlanClick(p.id)}
                    className={
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm " +
                      (disabledAll || conflictDisabled
                        ? "opacity-50"
                        : "hover:bg-muted")
                    }
                  >
                    <span
                      className={
                        "inline-flex h-4 w-4 items-center justify-center rounded border " +
                        (checked ? "bg-foreground text-background" : "")
                      }
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })
            )}
          </div>

          {selectedIds.length === 0 && !disabledAll ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Wajib pilih minimal 1 plan.
            </p>
          ) : null}
        </div>

        {/* ✅ Tombol disable sampai valid */}
        <Button className="w-full" type="submit" disabled={!canSubmit}>
          Tambah Promo
        </Button>

        {!disabledAll && !requiredOk ? (
          <p className="text-[11px] text-muted-foreground text-center">
            Lengkapi: nama, diskon 1–100, start, (kuota valid bila diisi), dan
            pilih minimal 1 plan.
          </p>
        ) : null}

        <p className="text-[11px] text-muted-foreground">
          Promo bisa di-archive. Jika promo sudah dipakai, edit field inti akan
          dikunci.
        </p>
      </form>
    </>
  );
}
