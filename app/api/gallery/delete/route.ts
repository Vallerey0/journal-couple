import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2 } from "@/lib/cloudflare/r2";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    /* ================= AUTH ================= */
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ================= GET ITEM ================= */
    const { data: item, error: fetchError } = await supabase
      .from("gallery_items")
      .select("id, image_path, couple_id")
      .eq("id", itemId)
      .maybeSingle();

    if (fetchError) {
      console.error("[DELETE GALLERY] Fetch Error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!item) {
      console.log(`[DELETE GALLERY] Item not found for ID: ${itemId}`);
      return NextResponse.json(
        { error: "Gallery item not found" },
        { status: 404 },
      );
    }

    // 2.5 VERIFY OWNERSHIP MANUALLY (Resilient to RLS issues)
    const { data: coupleCheck } = await supabase
      .from("couples")
      .select("id")
      .eq("id", item.couple_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!coupleCheck) {
      console.error(
        `[DELETE GALLERY] User ${user.id} unauthorized for couple ${item.couple_id}`,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Assuming image_path ends with /display.webp
    const basePath = item.image_path.replace("/display.webp", "");

    /* ================= DELETE FILES ================= */
    // Delete mandatory new files + legacy files (original/preview)
    try {
      // Kita harus memastikan minimal file utama terhapus sebelum lanjut ke DB
      const r2Results = await Promise.allSettled([
        deleteFromR2(`${basePath}/display.webp`),
        deleteFromR2(`${basePath}/thumb.webp`),
      ]);

      // Cek apakah ada error kritis (selain 404/NotFound)
      for (const res of r2Results) {
        if (res.status === "rejected") {
          const errorMsg = String(res.reason);
          if (!errorMsg.includes("NotFound") && !errorMsg.includes("404")) {
            console.error("[DELETE GALLERY] Critical R2 Error:", errorMsg);
            return NextResponse.json(
              {
                error:
                  "Gagal menghapus file di storage. Penghapusan dibatalkan.",
              },
              { status: 500 },
            );
          }
        }
      }

      // Cleanup legacy file secara silent (tidak krusial)
      await Promise.allSettled([
        deleteFromR2(`${basePath}/original.png`),
        deleteFromR2(`${basePath}/preview.webp`),
      ]);
    } catch (e) {
      console.error("[DELETE GALLERY] Unexpected R2 error:", e);
    }

    /* ================= DELETE DATABASE ROW ================= */
    const { error: deleteError } = await supabase
      .from("gallery_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      console.error("[DELETE GALLERY] DB Delete Error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // FINAL VERIFICATION
    const { data: stillExists } = await supabase
      .from("gallery_items")
      .select("id")
      .eq("id", itemId)
      .maybeSingle();

    if (stillExists) {
      console.error(
        "[DELETE GALLERY] Record still stuck in DB after DELETE command!",
      );
      return NextResponse.json(
        {
          error:
            "Data database tertahan. Mohon cek RLS Policy di Supabase Dashboard.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE gallery error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
