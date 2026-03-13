import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  uploadToR2,
  deleteFromR2,
  getPresignedUploadUrl,
  getObject,
  copyObject,
} from "@/lib/cloudflare/r2";
import { randomUUID, createHash } from "crypto";
import { parseBuffer } from "music-metadata";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";

export const runtime = "nodejs";

/* =======================
   GET — get presigned upload url
======================= */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guard = await requireActiveSubscription();
  if (!guard.allowed) {
    return NextResponse.json(
      { error: "Subscription required" },
      { status: 403 },
    );
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return NextResponse.json({ error: "Couple not found" }, { status: 404 });
  }

  // Limit Check
  const MAX_MUSIC = guard.trial ? 1 : 3;
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

  const fileId = randomUUID();
  const tempKey = `temp/users/${user.id}/music/${fileId}.mp3`;

  const uploadUrl = await getPresignedUploadUrl({
    key: tempKey,
    contentType: "audio/mpeg",
    expiresIn: 600,
  });

  return NextResponse.json({ uploadUrl, tempKey });
}

/* =======================
   POST — upload user music (Direct or Finalize)
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
  const tempKey = formData.get("tempKey") as string | null;

  if (!file && !tempKey) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  // =====================
  // PROCESS BUFFER
  // =====================
  let buffer: Buffer;
  let fileName: string = "Untitled Music";

  if (tempKey) {
    // Presigned flow
    buffer = await getObject(tempKey);
    fileName = (formData.get("fileName") as string) || "Untitled Music";
  } else if (file) {
    // Legacy flow
    if (file.type !== "audio/mpeg") {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
    fileName = file.name;
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // =====================
  // DURATION
  // =====================
  const meta = await parseBuffer(buffer, "audio/mpeg");
  const duration = Math.round(
    meta.format.duration ?? buffer.length / (16 * 1024),
  );

  if (duration < 5 || duration > 600) {
    if (tempKey) await deleteFromR2(tempKey).catch(() => {});
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
    if (tempKey) await deleteFromR2(tempKey).catch(() => {});
    return NextResponse.json(
      { error: "Music already exists" },
      { status: 409 },
    );
  }

  // =====================
  // R2 PATH
  // =====================
  const fileId = randomUUID();
  const finalKey = `users/${user.id}/couples/${couple.id}/music/${fileId}.mp3`;
  const baseUrl = (process.env.NEXT_PUBLIC_R2_DOMAIN || "").replace(/\/$/, "");
  const fileUrl = `${baseUrl}/${finalKey}`;

  // =====================
  // TRANSACTION-LIKE FLOW
  // =====================
  try {
    if (tempKey) {
      // 1️⃣ copy from temp to final
      await copyObject(tempKey, finalKey);
      await deleteFromR2(tempKey);
    } else {
      // 1️⃣ upload directly (Legacy)
      await uploadToR2({
        key: finalKey,
        body: buffer,
        contentType: "audio/mpeg",
      });
    }

    // 2️⃣ insert DB
    const { error } = await supabase.from("journal_music").insert({
      couple_id: couple.id,
      file_path: finalKey,
      file_url: fileUrl,
      duration_seconds: duration,
      file_hash: fileHash,
      title: fileName.replace(/\.[^/.]+$/, "") || "Untitled Music",
    });

    if (error) {
      // rollback R2 jika DB gagal
      await deleteFromR2(finalKey);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    await deleteFromR2(finalKey).catch(() => {});
    if (tempKey) await deleteFromR2(tempKey).catch(() => {});
    return NextResponse.json(
      { error: e.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
