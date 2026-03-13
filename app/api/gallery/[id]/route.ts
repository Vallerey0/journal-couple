import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2, deleteFromR2, getObject } from "@/lib/cloudflare/r2";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB (mobile-first)
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { journal_title, journal_text, taken_at, is_favorite, memory_type } =
      body;

    const { error } = await supabase
      .from("gallery_items")
      .update({
        journal_title,
        journal_text,
        taken_at: taken_at || null,
        is_favorite,
        memory_type: memory_type || null,
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH gallery error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  let newBasePath: string | null = null;
  let tempKey: string | null = null;

  try {
    /* ================= AUTH ================= */
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ================= PARSE & VALIDATE ================= */
    const form = await req.formData();
    const file = form.get("file") as File | null;
    tempKey = form.get("tempKey") as string | null;

    if (!file && !tempKey) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    /* ================= GET OLD DATA ================= */
    const { data: item } = await supabase
      .from("gallery_items")
      .select("image_path, couple_id")
      .eq("id", params.id)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Assuming image_path ends with /display.webp
    const oldBasePath = item.image_path.replace("/display.webp", "");

    /* ================= PROCESS BUFFER ================= */
    let buffer: Buffer;

    if (tempKey) {
      buffer = await getObject(tempKey);
    } else if (file) {
      // Legacy fallback
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Invalid type" }, { status: 415 });
      }
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    /* ================= PROCESS IMAGES (SHARP) ================= */
    const mediaId = nanoid(8);
    const userId = user.id;

    newBasePath = `users/${userId}/couples/${item.couple_id}/gallery/images/${Date.now()}_${mediaId}`;

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

    /* ================= UPLOAD NEW ================= */
    await Promise.all([
      uploadToR2({
        key: `${newBasePath}/display.webp`,
        body: displayBuffer,
        contentType: "image/webp",
      }),
      uploadToR2({
        key: `${newBasePath}/thumb.webp`,
        body: thumbBuffer,
        contentType: "image/webp",
      }),
    ]);

    // Cleanup temp if exists
    if (tempKey) {
      await deleteFromR2(tempKey).catch(() => {});
    }

    /* ================= UPDATE DB ================= */
    const newDisplayPath = `${newBasePath}/display.webp`;

    const { error } = await supabase
      .from("gallery_items")
      .update({
        image_path: newDisplayPath,
      })
      .eq("id", params.id);

    if (error) {
      console.error("Supabase Update Error (PUT):", error);
      throw error;
    }

    /* ================= DELETE OLD (CLEANUP ALL VARIANTS) ================= */
    // We try to delete all possible variants to prevent orphans from legacy uploads
    await Promise.allSettled([
      deleteFromR2(`${oldBasePath}/display.webp`),
      deleteFromR2(`${oldBasePath}/thumb.webp`),
      deleteFromR2(`${oldBasePath}/original.png`), // legacy
      deleteFromR2(`${oldBasePath}/preview.webp`), // legacy
    ]);

    return NextResponse.json({ success: true, image_path: newDisplayPath });
  } catch (err: any) {
    /* ================= ROLLBACK ================= */
    if (newBasePath) {
      await Promise.allSettled([
        deleteFromR2(`${newBasePath}/display.webp`),
        deleteFromR2(`${newBasePath}/thumb.webp`),
      ]);
    }
    if (tempKey) {
      await deleteFromR2(tempKey).catch(() => {});
    }

    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
