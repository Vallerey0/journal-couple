import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";
import { getActiveCouple } from "@/lib/couples/queries";
import { createClient } from "@/lib/supabase/server";
import { getPublicMediaUrl } from "@/lib/media/url";
import { Metadata } from "next";

import { GalleryGrid } from "./_components/gallery-grid";

export const metadata: Metadata = {
  title: "Gallery",
};

export default async function GalleryPage() {
  /* =====================================================
     SUBSCRIPTION GUARD
     ===================================================== */
  const sub = await requireActiveSubscription();

  if (!sub.allowed) {
    redirect("/subscribe");
  }

  /* =====================================================
     ACTIVE COUPLE
     ===================================================== */
  const couple = await getActiveCouple();
  if (!couple) {
    redirect("/couple/new");
  }

  /* =====================================================
     FETCH GALLERY ITEMS (PATH ONLY)
     ===================================================== */
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_items")
    .select(
      `
        id,
        image_path,
        journal_title,
        journal_text,
        display_order,
        taken_at,
        is_favorite,
        memory_type
      `,
    )
    .eq("couple_id", couple.id)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Fetch gallery error:", error);
    // fail safe → tampilkan kosong
  }

  /* =====================================================
     TRANSFORM (SERVER SIDE)
     ===================================================== */
  const items =
    data?.map((item) => ({
      id: item.id,
      image_url: getPublicMediaUrl(item.image_path),
      thumbnail_url: item.image_path
        ? getPublicMediaUrl(
            item.image_path.replace("display.webp", "thumb.webp"),
          )
        : null,
      journal_title: item.journal_title,
      journal_text: item.journal_text,
      display_order: item.display_order,
      taken_at: item.taken_at,
      is_favorite: item.is_favorite,
      memory_type: item.memory_type,
    })) ?? [];

  /* =====================================================
     STATE
     ===================================================== */
  const isTrial = !!sub.trial;
  const isGrace = !!sub.grace;
  const limit = isTrial ? 5 : 10;

  /* =====================================================
     RENDER
     ===================================================== */
  return (
    <div className="relative">
      <GalleryGrid
        items={items}
        isTrial={isTrial}
        isGrace={isGrace}
        limit={limit}
        coupleId={couple.id}
      />
    </div>
  );
}
