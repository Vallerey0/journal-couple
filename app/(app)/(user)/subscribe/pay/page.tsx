import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SnapPayButton from "../SnapPayButton";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(n);
}

export default async function SubscribePayPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const sp = await searchParams;
  const intentId = sp.intent;

  if (!intentId) redirect("/subscribe");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) redirect("/login");

  const { data: intent, error } = await supabase
    .from("payment_intents")
    .select(
      `
      id, user_id, plan_id, promotion_id, coupon_code,
      base_price_idr, discount_percent_applied, final_price_idr,
      status, midtrans_order_id, midtrans_token, midtrans_redirect_url,
      created_at,
      subscription_plans:plan_id ( name, duration_days )
    `,
    )
    .eq("id", intentId)
    .maybeSingle();

  if (error) {
    return (
      <pre className="text-xs text-red-500">
        {JSON.stringify(error, null, 2)}
      </pre>
    );
  }

  // kalau intent tidak ada / bukan miliknya, RLS biasanya bikin null
  if (!intent) {
    return (
      <div className="space-y-3 text-sm">
        <p>Checkout tidak ditemukan.</p>
        <Link className="underline" href="/subscribe">
          Kembali ke Subscribe
        </Link>
      </div>
    );
  }

  const planName = (intent as any).subscription_plans?.name ?? "Plan";
  const durationDays = (intent as any).subscription_plans?.duration_days ?? 0;

  const discount = Number(intent.discount_percent_applied ?? 0);
  const base = Number(intent.base_price_idr ?? 0);
  const final = Number(intent.final_price_idr ?? 0);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-0 py-8 max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-2xl sm:text-3xl font-bold text-transparent">
            Konfirmasi Pembayaran
          </h1>
          <p className="text-sm text-muted-foreground">
            Periksa kembali pesananmu sebelum melanjutkan.
          </p>
        </div>

        <Card className="gap-4 p-6 border-zinc-200/50 bg-white/50 shadow-xl shadow-pink-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-white/10 pb-4 mb-4">
            <p className="text-lg font-bold text-foreground">{planName}</p>
            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
              {durationDays} hari
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga Paket</span>
              <span className="font-medium">{formatIDR(base)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Diskon</span>
              <span
                className={
                  discount
                    ? "text-green-600 dark:text-green-400 font-medium"
                    : "text-muted-foreground"
                }
              >
                {discount ? `-${discount}%` : "-"}
              </span>
            </div>

            {intent.coupon_code && (
              <div className="flex justify-between items-center bg-pink-500/5 p-2 rounded-lg border border-pink-500/10">
                <span className="text-xs text-pink-600 dark:text-pink-400">
                  Kode Kupon
                </span>
                <span className="text-xs font-bold text-pink-700 dark:text-pink-300">
                  {intent.coupon_code}
                </span>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-zinc-200/50 dark:border-white/10 flex justify-between items-baseline">
              <span className="font-semibold text-muted-foreground">
                Total Pembayaran
              </span>
              <span className="text-2xl font-bold bg-gradient-to-br from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {formatIDR(final)}
              </span>
            </div>
          </div>
        </Card>

        <SnapPayButton intentId={intent.id} />

        <Button
          asChild
          variant="outline"
          className="w-full h-11 rounded-xl border-zinc-200 bg-white/50 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <Link href="/subscribe">← Ganti Plan / Kupon</Link>
        </Button>
      </div>
    </div>
  );
}
