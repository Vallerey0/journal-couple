import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { uploadToR2, deleteFromR2 } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB (resized by sharp later)
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function POST(req: Request) {
  let basePath: string | null = null;

  try {
    /* =====================================================
       PARSE & VALIDATE
       ===================================================== */
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const coupleId = form.get("couple_id") as string | null;
    const journalTitle = form.get("journal_title") as string | null;
    const journalText = form.get("journal_text") as string | null;
    const takenAt = form.get("taken_at") as string | null;
    const isFavorite = form.get("is_favorite") === "true";
    const memoryType = form.get("memory_type") as string | null;

    if (!file || !coupleId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1. Validate File Size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 413 },
      );
    }

    // 2. Validate File Type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WEBP, HEIC allowed." },
        { status: 415 },
      );
    }

    /* =====================================================
       AUTH
       ===================================================== */
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =====================================================
       PROCESS IMAGES (SHARP)
       ===================================================== */
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const mediaId = nanoid(8);
    const userId = user.id;

    // Path structure: users/{user_id}/couples/{couple_id}/gallery/images/{uuid}/
    basePath = `users/${userId}/couples/${coupleId}/gallery/images/${timestamp}_${mediaId}`;

    // A. Display (1200px, quality 80)
    const displayBuffer = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // B. Thumb (400px, quality 70)
    const thumbBuffer = await sharp(buffer)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    /* =====================================================
       UPLOAD TO R2
       ===================================================== */
    await Promise.all([
      uploadToR2({
        key: `${basePath}/display.webp`,
        body: displayBuffer,
        contentType: "image/webp",
      }),
      uploadToR2({
        key: `${basePath}/thumb.webp`,
        body: thumbBuffer,
        contentType: "image/webp",
      }),
    ]);

    /* =====================================================
       DATABASE INSERT
       ===================================================== */
    // Get display order
    const { data: maxOrder } = await supabase
      .from("gallery_items")
      .select("display_order")
      .eq("couple_id", coupleId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Start from 0 (consistent with frontend reorder logic)
    const nextOrder = (maxOrder?.display_order ?? -1) + 1;
    const displayPath = `${basePath}/display.webp`;

    const { error } = await supabase.from("gallery_items").insert({
      couple_id: coupleId,
      image_path: displayPath,
      display_order: nextOrder,
      journal_title: journalTitle,
      journal_text: journalText,
      taken_at: takenAt || null,
      is_favorite: isFavorite,
      memory_type: memoryType || null,
      is_primary: false,
      allow_flip: true,
      is_visible: true,
      is_locked: false,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      media_id: mediaId,
      image_path: displayPath,
    });
  } catch (err: any) {
    console.error("Upload image error:", err);

    /* =====================================================
       ROLLBACK
       ===================================================== */
    if (basePath) {
      await Promise.allSettled([
        deleteFromR2(`${basePath}/display.webp`),
        deleteFromR2(`${basePath}/thumb.webp`),
      ]);
    }

    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
