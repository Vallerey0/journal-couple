"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createCheckoutIntentAction, checkCouponAction } from "./actions";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Define the shape of a plan with discount info pre-calculated
export type PlanWithPricing = {
  id: string;
  name: string;
  duration_days: number;
  description: string | null;
  base_price: number;
  final_price: number;
  discount_percent: number;
  discount_amount: number;
};

interface SubscribeFormProps {
  plans: PlanWithPricing[];
  hasPendingIntent: boolean;
}

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function SubscribeForm({
  plans,
  hasPendingIntent,
}: SubscribeFormProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [couponCode, setCouponCode] = useState("");
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_percent: number;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isPending) {
      e.preventDefault();
      return;
    }
    if (!selectedPlanId) {
      e.preventDefault();
      toast.error("Pilih salah satu paket terlebih dahulu.");
      return;
    }

    // Use transition to show loading state while server action is processing
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createCheckoutIntentAction(formData);
    });
  };

  const handleApplyCoupon = async () => {
    if (isCheckingCoupon) return;

    if (!selectedPlanId) {
      toast.error("Pilih paket terlebih dahulu sebelum menggunakan kupon.");
      return;
    }
    if (!couponCode.trim()) {
      toast.error("Masukkan kode kupon.");
      return;
    }

    setIsCheckingCoupon(true);
    try {
      const result = await checkCouponAction(couponCode, selectedPlanId);
      if (result.error) {
        toast.error(result.error);
        setAppliedCoupon(null);
      } else if (result.success && result.discount_percent !== undefined) {
        toast.success(result.message);
        setAppliedCoupon({
          code: result.code ?? couponCode,
          discount_percent: result.discount_percent,
        });
      }
    } catch (error) {
      toast.error("Gagal mengecek kupon.");
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    // Reset applied coupon when plan changes, as it might not be valid for the new plan
    if (appliedCoupon) {
      setAppliedCoupon(null);
      toast.info("Kupon direset karena paket berubah.");
    }
  };

  return (
    <form
      action={createCheckoutIntentAction}
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      <div className="space-y-4" id="plan">
        {plans.length === 0 ? (
          <Card className="p-8 text-center border-zinc-200/50 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
            <p className="text-muted-foreground">
              Belum ada paket tersedia saat ini.
            </p>
          </Card>
        ) : (
          plans.map((p) => {
            // Recalculate price if coupon is applied AND this is the selected plan
            const isSelected = selectedPlanId === p.id;
            const useCoupon = isSelected && appliedCoupon;

            // Stacking Logic: Auto (p.discount_percent) + Coupon
            const autoDiscount = p.discount_percent;
            const couponDiscount = useCoupon
              ? appliedCoupon.discount_percent
              : 0;
            const currentDiscount = Math.min(
              100,
              autoDiscount + couponDiscount,
            );

            const currentDiscountAmount = Math.floor(
              (p.base_price * currentDiscount) / 100,
            );
            const currentFinalPrice = Math.max(
              0,
              p.base_price - currentDiscountAmount,
            );

            return (
              <label
                key={p.id}
                className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border border-zinc-200/50 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80 hover:shadow-lg hover:shadow-pink-500/5 hover:border-pink-500/30 dark:border-white/10 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 ${
                  autoDiscount > 0 ? "ring-1 ring-pink-500/20" : ""
                }`}
              >
                {/* Walking Light Effect for Auto Discount */}
                {autoDiscount > 0 && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,#ec4899_320deg,#a855f7_360deg)] opacity-40 blur-[2px]"
                    />
                    {/* Inner mask to keep the light on the border only */}
                    <div className="absolute inset-[2px] rounded-[14px] bg-white/90 dark:bg-zinc-900/90 z-10" />
                  </div>
                )}

                <div className="relative z-20 pt-1">
                  <input
                    type="radio"
                    name="plan_id"
                    value={p.id}
                    required
                    checked={isSelected}
                    onChange={() => handlePlanChange(p.id)}
                    className="peer h-5 w-5 border-2 border-zinc-300 text-pink-500 focus:ring-pink-500 dark:border-zinc-600"
                  />
                </div>

                <div className="relative z-20 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                        {p.name}
                      </span>
                      {currentDiscount > 0 && (
                        <span className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          {useCoupon && autoDiscount > 0
                            ? `Promo ${autoDiscount}% + Kupon ${couponDiscount}%`
                            : useCoupon
                              ? `KUPON ${couponDiscount}%`
                              : `HEMAT ${autoDiscount}%`}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                      {p.duration_days} hari
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    {currentDiscount > 0 ? (
                      <>
                        <span className="text-2xl font-bold text-foreground">
                          {formatIDR(currentFinalPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through decoration-pink-500/50 decoration-2">
                          {formatIDR(p.base_price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-foreground">
                        {formatIDR(p.base_price)}
                      </span>
                    )}
                  </div>

                  {p.description && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Selection Ring Animation */}
                <div
                  className={`absolute inset-0 rounded-2xl border-2 transition-all pointer-events-none z-30 ${
                    isSelected ? "border-pink-500" : "border-transparent"
                  }`}
                />
              </label>
            );
          })
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-zinc-200/50 dark:border-white/10"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white/50 px-2 text-xs text-muted-foreground backdrop-blur-xl dark:bg-zinc-950/50 rounded-full">
            Opsi Tambahan
          </span>
        </div>
      </div>

      <Card className="p-5 border-zinc-200/50 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/40">
        <label className="block text-sm font-semibold text-foreground mb-1">
          Kode Kupon
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Punya kode promo spesial? Masukkan di sini.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              name="coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all dark:border-white/10 dark:bg-black/20"
            />
            <div className="absolute right-3 top-2.5 text-xs font-bold text-pink-500 pointer-events-none opacity-50">
              %
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyCoupon}
            disabled={isCheckingCoupon || !couponCode}
            className="rounded-xl"
          >
            {isCheckingCoupon ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Terapkan"
            )}
          </Button>
        </div>
      </Card>

      <div className="pt-2">
        <Button
          className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-lg shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.01] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Memproses...</span>
            </div>
          ) : hasPendingIntent ? (
            "Buat Pesanan Baru"
          ) : (
            "Lanjut ke Pembayaran →"
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3 px-4">
          {hasPendingIntent
            ? "Membuat pesanan baru akan membatalkan tagihan sebelumnya secara otomatis."
            : "Pembayaran aman & terenkripsi. Kamu bisa membatalkan kapan saja."}
        </p>
      </div>
    </form>
  );
}
