import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getPresignedUploadUrl } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get("contentType") || "image/jpeg";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = nanoid(12);
    const tempKey = `temp/users/${user.id}/story/${fileId}`;

    const uploadUrl = await getPresignedUploadUrl({
      key: tempKey,
      contentType,
      expiresIn: 600,
    });

    return NextResponse.json({ uploadUrl, tempKey });
  } catch (err: unknown) {
    console.error("GET Presigned URL Error (story):", err);
    return NextResponse.json(
      { error: "Gagal mendapatkan izin upload storage" },
      { status: 500 },
    );
  }
}
