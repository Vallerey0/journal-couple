"use server";

import { revalidatePath } from "next/cache";
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

function assertAdmin(profile: any) {
  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function getMusicUploadUrlAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  assertAdmin(profile);

  const fileId = randomUUID();
  const tempKey = `temp/music/${fileId}.mp3`;

  const uploadUrl = await getPresignedUploadUrl({
    key: tempKey,
    contentType: "audio/mpeg",
    expiresIn: 600, // 10 minutes
  });

  return { uploadUrl, tempKey };
}

export async function createDefaultMusicAction(formData: FormData) {
  const supabase = await createClient();

  // 1. Auth Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  assertAdmin(profile);

  // 2. Extract Data
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isPremiumOnly = formData.get("is_premium_only") === "on";
  const file = formData.get("file") as File | null;
  const tempKey = formData.get("tempKey") as string | null;

  if (!title || (!file && !tempKey)) {
    throw new Error("Judul dan file wajib diisi");
  }

  // 3. Process File
  let buffer: Buffer;

  if (tempKey) {
    // Direct R2 Upload flow (Bypass Vercel limit)
    buffer = await getObject(tempKey);
  } else if (file && file.size > 0) {
    // Standard flow (Dev or small files)
    if (file.type !== "audio/mpeg") {
      throw new Error("Format file harus MP3");
    }
    buffer = Buffer.from(await file.arrayBuffer());
  } else {
    throw new Error("File tidak ditemukan");
  }

  // Duration
  const meta = await parseBuffer(buffer, "audio/mpeg");
  const duration =
    meta.format.duration != null
      ? Math.round(meta.format.duration)
      : Math.round(buffer.length / (16 * 1024));

  if (duration < 5 || duration > 600) {
    if (tempKey) await deleteFromR2(tempKey).catch(() => {});
    throw new Error("Durasi musik harus antara 5 detik - 10 menit");
  }

  // Hash (Anti Duplicate)
  const fileHash = createHash("sha256").update(buffer).digest("hex");

  const { data: exists } = await supabase
    .from("journal_default_music")
    .select("id")
    .eq("file_hash", fileHash)
    .maybeSingle();

  if (exists) {
    if (tempKey) await deleteFromR2(tempKey).catch(() => {});
    throw new Error("File musik ini sudah ada di library");
  }

  // 4. Sort Order
  const { data: maxOrder } = await supabase
    .from("journal_default_music")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (maxOrder?.sort_order ?? -1) + 1;

  // 5. Finalize Storage
  const fileId = randomUUID();
  const finalKey = `default-music/${fileId}.mp3`;
  const baseUrl = (process.env.NEXT_PUBLIC_R2_DOMAIN || "").replace(/\/$/, "");
  const fileUrl = `${baseUrl}/${finalKey}`;

  try {
    if (tempKey) {
      // Move from temp to final
      await copyObject(tempKey, finalKey);
      await deleteFromR2(tempKey);
    } else {
      // Upload directly from buffer
      await uploadToR2({
        key: finalKey,
        body: buffer,
        contentType: "audio/mpeg",
      });
    }

    // Insert to DB
    const { error } = await supabase.from("journal_default_music").insert({
      code: `${slugify(title)}_${fileId.slice(0, 6)}`,
      title,
      description: description || null,
      file_url: fileUrl,
      duration_seconds: duration,
      is_premium_only: isPremiumOnly,
      file_hash: fileHash,
      sort_order: nextSortOrder,
    });

    if (error) {
      // Rollback R2
      await deleteFromR2(finalKey);
      throw new Error(error.message);
    }
  } catch (err: any) {
    // Ensure cleanup if something unexpected happens
    await deleteFromR2(finalKey).catch(() => {});
    if (tempKey) await deleteFromR2(tempKey).catch(() => {});
    throw new Error(err.message || "Internal Server Error");
  }

  revalidatePath("/admin/default-music");
}

export async function updateDefaultMusicAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  assertAdmin(profile);

  const id = String(formData.get("id"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description") ?? "");
  const isPremiumOnly = formData.get("is_premium_only") === "on";
  const file = formData.get("file") as File | null;
  const tempKey = formData.get("tempKey") as string | null;

  const updates: any = {
    title,
    description: description || null,
    is_premium_only: isPremiumOnly,
  };

  if ((file && file.size > 0) || tempKey) {
    let buffer: Buffer;

    if (tempKey) {
      buffer = await getObject(tempKey);
    } else if (file && file.size > 0) {
      if (file.type !== "audio/mpeg") {
        throw new Error("Format file harus MP3");
      }
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      throw new Error("File tidak ditemukan");
    }

    // Duration
    const meta = await parseBuffer(buffer, "audio/mpeg");
    const duration =
      meta.format.duration != null
        ? Math.round(meta.format.duration)
        : Math.round(buffer.length / (16 * 1024));

    if (duration < 5 || duration > 600) {
      if (tempKey) await deleteFromR2(tempKey).catch(() => {});
      throw new Error("Durasi musik harus antara 5 detik - 10 menit");
    }

    // Hash
    const fileHash = createHash("sha256").update(buffer).digest("hex");

    // Check duplicate hash (exclude current id)
    const { data: exists } = await supabase
      .from("journal_default_music")
      .select("id")
      .eq("file_hash", fileHash)
      .neq("id", id)
      .maybeSingle();

    if (exists) {
      if (tempKey) await deleteFromR2(tempKey).catch(() => {});
      throw new Error("File musik ini sudah ada di library");
    }

    // Get old file to delete
    const { data: oldItem } = await supabase
      .from("journal_default_music")
      .select("file_url")
      .eq("id", id)
      .single();

    // Finalize storage
    const fileId = randomUUID();
    const finalKey = `default-music/${fileId}.mp3`;
    const baseUrl = (process.env.NEXT_PUBLIC_R2_DOMAIN || "").replace(
      /\/$/,
      "",
    );
    const fileUrl = `${baseUrl}/${finalKey}`;

    if (tempKey) {
      await copyObject(tempKey, finalKey);
      await deleteFromR2(tempKey);
    } else {
      await uploadToR2({
        key: finalKey,
        body: buffer,
        contentType: "audio/mpeg",
      });
    }

    // Add to updates
    updates.file_url = fileUrl;
    updates.duration_seconds = duration;
    updates.file_hash = fileHash;
    updates.code = `${slugify(title)}_${fileId.slice(0, 6)}`;

    // Delete old file
    if (oldItem?.file_url) {
      const baseUrl = (process.env.NEXT_PUBLIC_R2_DOMAIN || "").replace(
        /\/$/,
        "",
      );
      const oldKey = oldItem.file_url.replace(baseUrl + "/", "");
      if (oldKey) {
        await deleteFromR2(oldKey).catch((e) =>
          console.error("Failed to delete old file from R2:", e),
        );
      }
    }
  }

  const { error } = await supabase
    .from("journal_default_music")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/default-music");
}

export async function deleteDefaultMusicAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  assertAdmin(profile);

  const id = String(formData.get("id"));

  // Get file URL to delete from R2 (fetch first, but delete later)
  const { data: item } = await supabase
    .from("journal_default_music")
    .select("file_url")
    .eq("id", id)
    .single();

  // 1. Delete from DB FIRST
  // This ensures we don't delete the file if the DB record cannot be deleted (e.g. FK constraint)
  const { error, count } = await supabase
    .from("journal_default_music")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    // DO NOT delete from R2 if DB delete failed
    throw new Error(error.message);
  }

  if (count === 0) {
    // If no rows were deleted (e.g. RLS or already gone), DO NOT delete from R2
    throw new Error(
      "Gagal menghapus data: Item tidak ditemukan atau akses ditolak.",
    );
  }

  // 2. Delete from R2 (only if DB delete succeeded)
  // We use the previously fetched item data
  if (item?.file_url) {
    // Extract key from URL
    // URL format: process.env.NEXT_PUBLIC_R2_DOMAIN + "/" + key
    const baseUrl = (process.env.NEXT_PUBLIC_R2_DOMAIN || "").replace(
      /\/$/,
      "",
    );
    const key = item.file_url.replace(baseUrl + "/", "");
    if (key) {
      const { deleteFromR2 } = await import("@/lib/cloudflare/r2");
      // Use try-catch for R2 delete but don't throw error to user if it fails,
      // because DB record is already gone. We just log it.
      await deleteFromR2(key).catch((e) =>
        console.error("Failed to delete from R2 (orphan file):", e),
      );
    }
  }

  revalidatePath("/admin/default-music");
}

export async function reorderDefaultMusicAction(
  items: { id: string; sort_order: number }[],
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  assertAdmin(profile);

  // Update in batch or loop
  // Supabase upsert is good if we have all fields, but here we just update sort_order.
  // Loop is acceptable for admin action with small number of items.
  for (const item of items) {
    await supabase
      .from("journal_default_music")
      .update({ sort_order: item.sort_order })
      .eq("id", item.id);
  }

  revalidatePath("/admin/default-music");
}

export async function toggleDefaultMusicActiveAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  assertAdmin(profile);

  const id = String(formData.get("id"));
  const nextActive = formData.get("next_active") === "1";

  await supabase
    .from("journal_default_music")
    .update({ is_active: nextActive })
    .eq("id", id);

  revalidatePath("/admin/default-music");
}
