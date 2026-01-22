// gallery/page.tsx
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/utils/subscriptions/guard";
import { getActiveCouple } from "@/utils/couples/queries";
import { createClient } from "@/utils/supabase/server";
import { GalleryGrid } from "./_components/gallery-grid";
import { GalleryCreateButton } from "./_components/gallery-create-button";

export default async function GalleryPage() {
  const sub = await requireActiveSubscription();

  if (!sub.allowed) {
    redirect("/subscribe");
  }

  const couple = await getActiveCouple();
  if (!couple) {
    redirect("/couple/new");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_items")
    .select("id, image_url, journal_title, journal_text, display_order")
    .eq("couple_id", couple.id)
    .order("display_order", { ascending: true });

  const items = data || [];

  const isTrial = !!sub.trial;
  const isGrace = !!sub.grace;
  const limit = isTrial ? 5 : 10;

  return (
    <div className="relative">
      {/* 🔒 STICKY HEADER */}
      <div className="sticky top-0 z-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Image Gallery</h1>
              <p className="text-xs text-white/80">
                Simpan momen terbaik kalian
              </p>
            </div>

            <GalleryCreateButton
              isTrial={isTrial}
              isGrace={isGrace}
              count={items.length}
              limit={limit}
              coupleId={couple.id}
            />
          </div>
        </div>
      </div>

      {/* 📦 CONTENT AREA */}
      <div className="pt-6">
        <GalleryGrid
          items={items}
          isTrial={isTrial}
          isGrace={isGrace}
          limit={limit}
          coupleId={couple.id}
        />
      </div>
    </div>
  );
}
