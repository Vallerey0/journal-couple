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
      .select("image_path")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: "Gallery item not found" },
        { status: 404 },
      );
    }

    // Assuming image_path ends with /display.webp
    const basePath = item.image_path.replace("/display.webp", "");

    /* ================= DELETE FILES ================= */
    // Delete mandatory new files + legacy files (original/preview)
    await Promise.allSettled([
      deleteFromR2(`${basePath}/display.webp`),
      deleteFromR2(`${basePath}/thumb.webp`),
      deleteFromR2(`${basePath}/original.png`), // Legacy cleanup
      deleteFromR2(`${basePath}/preview.webp`), // Legacy cleanup
      // If we really want to be sure about original.*, we'd need to list objects in R2
      // but list objects isn't exposed in our helper.
      // For now, cleaning up the known ones is sufficient.
    ]);

    /* ================= DELETE DATABASE ROW ================= */
    const { error: deleteError } = await supabase
      .from("gallery_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
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
