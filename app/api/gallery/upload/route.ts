// app/api/gallery/upload/route.ts
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { uploadToR2 } from "@/utils/r2";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const coupleId = form.get("couple_id") as string;
    const journalTitle = form.get("journal_title") as string | null;
    const journalText = form.get("journal_text") as string | null;

    if (!file || !coupleId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const galleryId = nanoid();

    const basePath = `couples/${coupleId}/gallery/${galleryId}`;

    // 1️⃣ ORIGINAL (ASLI)
    await uploadToR2({
      key: `${basePath}/original.jpg`,
      body: buffer,
      contentType: file.type,
    });

    // 2️⃣ DISPLAY (untuk animasi)
    const display = await sharp(buffer)
      .resize({ width: 1200 })
      .jpeg({ quality: 85 })
      .toBuffer();

    await uploadToR2({
      key: `${basePath}/display.webp`,
      body: display,
      contentType: "image/webp",
    });

    // 3️⃣ THUMB (grid)
    const thumb = await sharp(buffer)
      .resize({ width: 400 })
      .webp({ quality: 75 })
      .toBuffer();

    await uploadToR2({
      key: `${basePath}/thumb.webp`,
      body: thumb,
      contentType: "image/webp",
    });

    // 4️⃣ BLUR PREVIEW
    const preview = await sharp(buffer)
      .resize({ width: 40 })
      .blur(20)
      .webp({ quality: 30 })
      .toBuffer();

    await uploadToR2({
      key: `${basePath}/preview.webp`,
      body: preview,
      contentType: "image/webp",
    });

    // 5️⃣ SIMPAN METADATA KE DB
    const supabase = await createClient();

    // Get max display_order
    const { data: maxOrderData } = await supabase
      .from("gallery_items")
      .select("display_order")
      .eq("couple_id", coupleId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.display_order ?? 0) + 1;
    const r2Domain = process.env.NEXT_PUBLIC_R2_DOMAIN || "";
    const imageUrl = r2Domain
      ? `${r2Domain}/${basePath}/display.webp`
      : `/${basePath}/display.webp`;

    const { error } = await supabase.from("gallery_items").insert({
      couple_id: coupleId,
      image_path: `${basePath}/display.webp`,
      image_url: imageUrl,
      display_order: nextOrder,
      journal_title: journalTitle,
      journal_text: journalText,
      is_primary: false,
      allow_flip: true,
      is_visible: true,
      is_locked: false,
      is_favorite: false,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      gallery_id: galleryId,
      paths: {
        original: `${basePath}/original.jpg`,
        display: `${basePath}/display.webp`,
        thumb: `${basePath}/thumb.webp`,
        preview: `${basePath}/preview.webp`,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
