import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCheckoutIntentAction } from "./actions";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(n);
}

export default async function SubscribePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return (
      <div className="text-sm">
        Kamu belum login.{" "}
        <Link className="underline" href="/login">
          Login
        </Link>
      </div>
    );
  }

  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select(
      "id, code, name, price_idr, duration_days, description, is_active, sort_order"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <pre className="text-xs text-red-500">
        {JSON.stringify(error, null, 2)}
      </pre>
    );
  }

  const safePlans = plans ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Berlangganan</h1>
        <p className="text-sm text-muted-foreground">
          Pilih paket premium untuk membuka semua fitur.
        </p>
      </div>

      <form action={createCheckoutIntentAction} className="space-y-3">
        <Card className="p-4">
          <p className="text-sm font-semibold">Pilih Plan</p>

          <div className="mt-3 grid gap-2">
            {safePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada plan aktif. Hubungi admin.
              </p>
            ) : (
              safePlans.map((p: any) => (
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
                    </div>
                    <p className="mt-1 text-sm">{formatIDR(p.price_idr)}</p>
                    {p.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    ) : null}
                  </div>
                </label>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold">Kode Kupon (opsional)</p>
          <p className="text-xs text-muted-foreground">
            Kalau punya kupon, masukkan di sini.
          </p>

          <input
            name="coupon"
            placeholder="Contoh: JOURNAL50"
            className="mt-3 w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
          />
        </Card>

        <Button className="w-full" type="submit">
          Lanjut Pembayaran
        </Button>

        <p className="text-xs text-muted-foreground">
          Dengan menekan tombol di atas, kamu akan diarahkan ke halaman
          pembayaran.
        </p>
      </form>
    </div>
  );
}
