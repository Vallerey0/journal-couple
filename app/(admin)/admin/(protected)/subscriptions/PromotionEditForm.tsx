"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CenterToast, useCenterToast } from "@/components/admin/CenterToast";

type Plan = { id: string; name: string };

type Promo = {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  discount_percent: number;
  new_customer_only: boolean;
  max_redemptions: number | null;
  archived_at: string | null;
  // untuk info/locking
  used: boolean;
  usedCount: number;
};

export default function PromotionEditForm({
  promo,
  plans,
  initialPlanIds,
  disabledPlanIds,
  disabledPlanMessageMap,
  action,
}: {
  promo: Promo;
  plans: Plan[];
  initialPlanIds: string[];
  disabledPlanIds: string[];
  disabledPlanMessageMap: Record<string, string>;
  action: (formData: FormData) => void;
}) {
  const { msg, show } = useCenterToast();

  // selected plan state
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const id of initialPlanIds) map[id] = true;
    return map;
  });

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const readOnly = !!promo.archived_at;
  const locked = promo.used || readOnly;

  function onPlanClick(planId: string) {
    if (readOnly) return;

    // kalau promo sudah dipakai, kunci pivot
    if (promo.used) {
      show("Promo sudah dipakai. Pilih plan dikunci untuk menjaga histori.");
      return;
    }

    const isConflict = disabledPlanIds.includes(planId);
    const isChecked = !!selected[planId];

    // ✅ aturan edit:
    // - kalau conflict dan user mau CHECK (isChecked=false) => blok
    // - kalau conflict tapi user mau UNCHECK (isChecked=true) => BOLEH
    if (isConflict && !isChecked) {
      show(
        disabledPlanMessageMap[planId] ||
          "Plan ini masih punya promo aktif lain. Akhiri/Archive promo itu dulu."
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
          if (readOnly) return;

          if (selectedCount === 0) {
            show("Pilih minimal 1 plan.");
            return;
          }

          // inject plan_id
          for (const p of plans) {
            if (selected[p.id]) fd.append("plan_id", p.id);
          }

          action(fd);
        }}
        className="mt-3 grid gap-3"
      >
        <input type="hidden" name="id" value={promo.id} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Nama</label>
            <input
              name="name"
              defaultValue={promo.name}
              required
              disabled={readOnly}
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Deskripsi</label>
            <input
              name="description"
              defaultValue={promo.description ?? ""}
              disabled={readOnly}
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Kode Kupon</label>
            <input
              name="code"
              defaultValue={promo.code ?? ""}
              disabled={locked}
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Diskon (%)</label>
            <input
              name="discount_percent"
              inputMode="numeric"
              defaultValue={String(promo.discount_percent)}
              disabled={locked}
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">
              End (opsional/unlimited)
            </label>
            <input
              name="end_at"
              type="datetime-local"
              placeholder="Isi kalau mau stop/extend"
              disabled={readOnly}
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
            />
            <p className="min-h-[16px] text-[11px] text-muted-foreground">
              Kalau kosong, end tidak berubah.
            </p>
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">
              Kuota (max redemptions)
            </label>
            <input
              name="max_redemptions"
              inputMode="numeric"
              defaultValue={promo.max_redemptions ?? ""}
              disabled={locked}
              placeholder="Contoh: 500 (kosong = unlimited)"
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
            />
            <p className="min-h-[16px] text-[11px] text-muted-foreground">
              Kosong = unlimited.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <input
            name="new_customer_only"
            type="checkbox"
            defaultChecked={!!promo.new_customer_only}
            disabled={locked}
          />
          <span>User baru saja (locked kalau sudah dipakai)</span>
        </label>

        {/* ✅ Plan picker edit (tanpa "semua plan") */}
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">
            Pilih plan yang mendapatkan promo (minimal 1).
          </p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {plans.map((p) => {
              const checked = !!selected[p.id];
              const isConflict = disabledPlanIds.includes(p.id);

              // ✅ conflict hanya disable tampilan saat plan belum dipilih.
              // kalau sudah dipilih, tetap bisa diklik untuk uncheck.
              const disabled =
                readOnly || promo.used || (isConflict && !checked);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPlanClick(p.id)}
                  className={
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm " +
                    (disabled ? "opacity-50" : "hover:bg-muted")
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
            })}
          </div>

          {promo.used ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Promo sudah dipakai ({promo.usedCount}). Pilih plan dikunci.
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Plan yang konflik promo aktif lain akan terkunci.
            </p>
          )}
        </div>

        {readOnly ? (
          <p className="text-[11px] text-muted-foreground">
            Promo archived read-only untuk audit.
          </p>
        ) : promo.used ? (
          <p className="text-[11px] text-muted-foreground">
            Promo sudah dipakai ({promo.usedCount}). Diskon/kuota/kode dikunci.
            Kamu hanya boleh ubah nama/deskripsi/end.
          </p>
        ) : null}

        {/* ✅ tombol disabled kalau no plan */}
        <Button
          type="submit"
          className="w-full"
          disabled={readOnly || selectedCount === 0}
        >
          Simpan Perubahan Promo
        </Button>

        {selectedCount === 0 && !readOnly ? (
          <p className="text-[11px] text-muted-foreground text-center">
            Pilih minimal 1 plan untuk menyimpan perubahan.
          </p>
        ) : null}
      </form>
    </>
  );
}
