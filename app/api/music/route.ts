import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2, deleteFromR2 } from "@/lib/cloudflare/r2";
import { randomUUID, createHash } from "crypto";
import { parseBuffer } from "music-metadata";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";

export const runtime = "nodejs";

/* =======================
   POST — upload user music
======================= */
export async function POST(req: Request) {
  const supabase = await createClient();

  // =====================
  // AUTH
  // =====================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // =====================
  // SUBSCRIPTION GUARD
  // =====================
  const guard = await requireActiveSubscription();

  if (!guard.allowed) {
    return NextResponse.json(
      { error: "Subscription required" },
      { status: 403 },
    );
  }

  // ⛔ grace period = read-only
  if (guard.grace) {
    return NextResponse.json(
      {
        error: "Subscription expired. Upload disabled.",
        remainingHours: guard.remainingHours,
      },
      { status: 403 },
    );
  }

  const MAX_MUSIC = guard.trial ? 1 : 3;

  // =====================
  // COUPLE
  // =====================
  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return NextResponse.json({ error: "Couple not found" }, { status: 404 });
  }

  // =====================
  // LIMIT CHECK
  // =====================
  const { count } = await supabase
    .from("journal_music")
    .select("id", { count: "exact", head: true })
    .eq("couple_id", couple.id);

  if ((count ?? 0) >= MAX_MUSIC) {
    return NextResponse.json(
      {
        error: guard.trial
          ? "Trial hanya bisa upload 1 music"
          : "Music limit reached",
      },
      { status: 403 },
    );
  }

  // =====================
  // FORM DATA
  // =====================
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.type !== "audio/mpeg") {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // =====================
  // DURATION
  // =====================
  const meta = await parseBuffer(buffer, "audio/mpeg");
  const duration = Math.round(
    meta.format.duration ?? buffer.length / (16 * 1024),
  );

  if (duration < 5 || duration > 600) {
    return NextResponse.json(
      { error: "Invalid music duration" },
      { status: 400 },
    );
  }

  // =====================
  // DUPLICATE CHECK
  // =====================
  const fileHash = createHash("sha256").update(buffer).digest("hex");

  const { data: exists } = await supabase
    .from("journal_music")
    .select("id")
    .eq("couple_id", couple.id)
    .eq("file_hash", fileHash)
    .maybeSingle();

  if (exists) {
    return NextResponse.json(
      { error: "Music already exists" },
      { status: 409 },
    );
  }

  // =====================
  // R2 PATH
  // =====================
  const fileId = randomUUID();
  const key = `users/${user.id}/couples/${couple.id}/music/${fileId}.mp3`;
  const fileUrl = `${process.env.NEXT_PUBLIC_R2_DOMAIN}/${key}`;

  // =====================
  // TRANSACTION-LIKE FLOW
  // =====================
  try {
    // 1️⃣ upload to R2
    await uploadToR2({
      key,
      body: buffer,
      contentType: "audio/mpeg",
    });

    // 2️⃣ insert DB
    const { error } = await supabase.from("journal_music").insert({
      couple_id: couple.id,
      file_path: key,
      file_url: fileUrl,
      duration_seconds: duration,
      file_hash: fileHash,
      title: file.name.replace(/\.[^/.]+$/, "") || "Untitled Music",
    });

    if (error) {
      // rollback R2 jika DB gagal
      await deleteFromR2(key);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    await deleteFromR2(key).catch(() => {});
    return NextResponse.json(
      { error: e.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
