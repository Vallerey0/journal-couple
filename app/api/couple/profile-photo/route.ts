import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  getPresignedUploadUrl,
  copyObject,
  deleteFromR2,
  getObject,
  uploadToR2,
} from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

/* =====================================================
   GET — get presigned upload url for profile photo
===================================================== */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get("contentType") || "image/jpeg";
    const type = searchParams.get("type"); // male or female

    if (!type || !["male", "female"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = nanoid(12);
    const tempKey = `temp/users/${user.id}/profile/${type}/${fileId}`;

    const uploadUrl = await getPresignedUploadUrl({
      key: tempKey,
      contentType: contentType,
      expiresIn: 600,
    });

    return NextResponse.json({ uploadUrl, tempKey });
  } catch (err: any) {
    console.error("GET Presigned URL Error:", err);
    return NextResponse.json(
      { error: "Gagal mendapatkan izin upload storage" },
      { status: 500 },
    );
  }
}

/* =====================================================
   POST — finalize profile photo upload
===================================================== */
export async function POST(req: Request) {
  try {
    const { tempKey, type, coupleId } = await req.json();

    if (!tempKey || !type || !coupleId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      `[POST] Finalizing profile: type=${type}, coupleId=${coupleId}, tempKey=${tempKey}`,
    );

    // 1. Get from temp
    const buffer = await getObject(tempKey);
    console.log(`[POST] Buffer retrieved from temp, size=${buffer.length}`);

    // 2. Process with Sharp (convert to WebP, resize for profile)
    const processedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: "cover" }) // Profile photo doesn't need to be huge
      .webp({ quality: 80 })
      .toBuffer();
    console.log(
      `[POST] Image processed with Sharp, size=${processedBuffer.length}`,
    );

    // 3. Upload to permanent location
    const timestamp = Date.now();
    const fileName = `${type}_${timestamp}.webp`;
    const permanentKey = `users/${user.id}/couples/${coupleId}/profile/${fileName}`;

    // 3a. Get old photo path to delete later
    const column = type === "male" ? "male_photo_url" : "female_photo_url";
    const { data: oldCouple, error: fetchOldError } = await supabase
      .from("couples")
      .select(column)
      .eq("id", coupleId)
      .single();

    if (fetchOldError) {
      console.error("[POST] Fetch old couple error:", fetchOldError);
      throw new Error(`Gagal mengambil data lama: ${fetchOldError.message}`);
    }

    if (!oldCouple) {
      console.error("[POST] No couple found with ID:", coupleId);
      throw new Error(
        "Data pasangan tidak ditemukan atau Anda tidak memiliki akses",
      );
    }

    const oldPath = oldCouple?.[column as keyof typeof oldCouple];
    console.log(`[POST] Old path retrieved: ${oldPath || "none"}`);

    // 3b. Upload new one
    await uploadToR2({
      key: permanentKey,
      body: processedBuffer,
      contentType: "image/webp",
    });
    console.log(`[POST] Uploaded to R2: ${permanentKey}`);

    // 4. Update database
    const { error: dbError } = await supabase
      .from("couples")
      .update({ [column]: permanentKey })
      .eq("id", coupleId);

    if (dbError) {
      console.error("[POST] Supabase update error:", dbError);
      throw dbError;
    }

    // 5. Cleanup
    if (oldPath) {
      await deleteFromR2(oldPath).catch((e) =>
        console.error("Failed to delete old profile photo:", e),
      );
    }
    await deleteFromR2(tempKey).catch((e) =>
      console.error("Failed to delete temp profile photo:", e),
    );

    return NextResponse.json({ success: true, path: permanentKey });
  } catch (err: any) {
    console.error("POST Finalize Profile Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses foto profil" },
      { status: 500 },
    );
  }
}

/* =====================================================
   DELETE — delete profile photo
===================================================== */
export async function DELETE(req: Request) {
  try {
    const { type, coupleId } = await req.json();

    if (!type || !coupleId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get current photo path from DB
    const column = type === "male" ? "male_photo_url" : "female_photo_url";
    const { data: couple, error: fetchError } = await supabase
      .from("couples")
      .select("male_photo_url, female_photo_url")
      .eq("id", coupleId)
      .single();

    if (fetchError) throw fetchError;

    const currentPath = couple[column as keyof typeof couple];

    if (currentPath) {
      // 2. Delete from R2
      await deleteFromR2(currentPath);
    }

    // 3. Update DB to null
    const { error: dbError } = await supabase
      .from("couples")
      .update({ [column]: null })
      .eq("id", coupleId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Profile Photo Error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus foto profil" },
      { status: 500 },
    );
  }
}
