import HomeClient, { type SubscriptionPlan } from "./HomeClient";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  const ctaHref = auth.user
    ? "/subscribe"
    : `/login?next=${encodeURIComponent("/subscribe")}`;

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select(
      "id, code, name, price_idr, duration_days, description, is_active, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const safePlans = (plans ?? []) as SubscriptionPlan[];

  return <HomeClient plans={safePlans} ctaHref={ctaHref} />;
}

