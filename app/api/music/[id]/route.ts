import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2, getObject } from "@/lib/cloudflare/r2";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const musicId = params.id;
  console.log(`[DELETE MUSIC] Attempting to delete music ID: ${musicId}`);

  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[DELETE MUSIC] No user found in session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log(`[DELETE MUSIC] User ID: ${user.id}`);

  // 2. Fetch the music item
  // Note: We use maybeSingle to avoid errors if not found.
  // We check ownership manually because RLS for DELETE can be more restrictive than SELECT.
  const { data: item, error: fetchError } = await supabase
    .from("journal_music")
    .select("id, file_path, couple_id")
    .eq("id", musicId)
    .maybeSingle();

  if (fetchError) {
    console.error("[DELETE MUSIC] Fetch Error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!item) {
    console.log(`[DELETE MUSIC] Music not found for ID: ${musicId}`);
    return NextResponse.json({ error: "Music not found" }, { status: 404 });
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
      `[DELETE MUSIC] User ${user.id} unauthorized for couple ${item.couple_id}`,
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 3. Cleanup Playlist
  console.log("[DELETE MUSIC] Cleaning up playlist...");
  await supabase
    .from("journal_playlists")
    .delete()
    .eq("couple_id", item.couple_id)
    .eq("source_id", item.id)
    .eq("source_type", "user");

  // 4. Delete from R2
  if (item.file_path) {
    console.log(`[DELETE MUSIC] Deleting from R2: ${item.file_path}`);
    try {
      await deleteFromR2(item.file_path);
      console.log("[DELETE MUSIC] R2 Delete successful");
    } catch (e: any) {
      // Jika error karena file memang tidak ada di R2, kita lanjutkan ke DB
      // Tapi jika error lain (koneksi, auth), kita STOP agar tidak ada file yatim piatu
      const errorMsg = e.message || String(e);
      if (errorMsg.includes("NotFound") || errorMsg.includes("404")) {
        console.warn(
          "[DELETE MUSIC] R2 File already gone, continuing to DB cleanup",
        );
      } else {
        console.error("[DELETE MUSIC] Critical R2 Delete Error:", errorMsg);
        return NextResponse.json(
          {
            error:
              "Gagal menghapus file di storage. Penghapusan dibatalkan demi keamanan data.",
          },
          { status: 500 },
        );
      }
    }
  }

  // 5. Delete from DB
  console.log("[DELETE MUSIC] Deleting from DB...");

  const { error: deleteError } = await supabase
    .from("journal_music")
    .delete()
    .eq("id", musicId);

  if (deleteError) {
    console.error("[DELETE MUSIC] DB Delete Error:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 6. FINAL VERIFICATION
  const { data: stillExists } = await supabase
    .from("journal_music")
    .select("id")
    .eq("id", musicId)
    .maybeSingle();

  if (stillExists) {
    console.error(
      "[DELETE MUSIC] Record still stuck in DB after DELETE command!",
    );
    return NextResponse.json(
      {
        error:
          "Data database tertahan. Mohon cek RLS Policy di Supabase Dashboard.",
      },
      { status: 500 },
    );
  }

  console.log("[DELETE MUSIC] All steps completed successfully");
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json();

  const { error } = await supabase
    .from("journal_music")
    .update({ title })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
