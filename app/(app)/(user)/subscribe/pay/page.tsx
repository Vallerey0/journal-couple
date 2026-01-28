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
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Konfirmasi checkout, lalu pilih metode pembayaran di bawah.
        </p>
      </div>

      <Card className="gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{planName}</p>
          <p className="text-xs text-muted-foreground">{durationDays} hari</p>
        </div>

        <div className="text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Harga</span>
            <span>{formatIDR(base)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Diskon</span>
            <span>{discount ? `-${discount}%` : "-"}</span>
          </div>

          <div className="mt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatIDR(final)}</span>
          </div>

          {intent.coupon_code ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Kupon: {intent.coupon_code}
            </p>
          ) : null}
        </div>
      </Card>

      <SnapPayButton intentId={intent.id} />

      <Button asChild variant="outline" className="w-full">
        <Link href="/subscribe">Ganti Plan / Kupon</Link>
      </Button>
    </div>
  );
}
