import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2 } from "@/lib/cloudflare/r2";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const supabase = await createClient();

  // 1. Validasi ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch item & verify couple ownership
  const { data: item } = await supabase
    .from("journal_music")
    .select("id, file_path, couple_id")
    .eq("id", params.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Music not found" }, { status: 404 });
  }

  // Verify couple belongs to user
  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("id", item.couple_id)
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 2. Ambil file_path & DELETE dari R2
  if (item.file_path) {
    try {
      await deleteFromR2(item.file_path);
    } catch (e) {
      console.error("Failed to delete from R2:", e);
      // Continue to delete DB record even if R2 fails (avoid zombie records)
      // or should we fail? Prompt says: "DELETE dari R2" then "DELETE row dari DB".
      // If R2 fails, usually we log and continue, or fail.
      // Given "Technical error shouldn't be shown to user", we log and proceed if possible,
      // but strictly following flow: 3. DELETE R2, 4. DELETE DB.
    }
  }

  // 3. DELETE row dari DB
  const { error } = await supabase
    .from("journal_music")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
