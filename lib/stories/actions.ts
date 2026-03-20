"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { deleteFromR2, getObject, uploadToR2 } from "@/lib/cloudflare/r2";
import {
  StoryPhaseKey,
  StoryData,
} from "@/app/(app)/(user)/story/_components/story-config";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
type StoryPhaseTextUpsertRow = {
  couple_id: string;
  phase_key: StoryPhaseKey;
  title: string;
  story: string;
  story_date: string | null;
};

/**
 * Ambil semua story phase milik user
 */
export async function getStoryPhases(): Promise<StoryData[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) return [];

  const { data, error } = await supabase
    .from("couple_story_phases")
    .select("*")
    .eq("couple_id", couple.id);

  if (error) {
    console.error(error);
    return [];
  }

  return (data as StoryData[]) || [];
}

/**
 * Create / Update story phase (UPSERT)
 */
export async function saveStoryPhase(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return { success: false, error: "Couple not found" };
  }

  const phase_key = formData.get("phase_key") as StoryPhaseKey;
  const title = formData.get("title") as string;
  const story = formData.get("content") as string;
  const story_date = formData.get("occurred_at") as string | null;

  if (!phase_key || !story) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    const payload: StoryPhaseTextUpsertRow = {
      couple_id: couple.id,
      phase_key,
      title,
      story,
      story_date: story_date || null,
    };

    const { error } = await supabase
      .from("couple_story_phases")
      .upsert(payload, { onConflict: "couple_id, phase_key" });

    if (error) throw error;

    revalidatePath("/story");
    return { success: true };
  } catch (err: unknown) {
    console.error(err);

    return {
      success: false,
      error: err instanceof Error ? err.message : "Internal Server Error",
    };
  }
}

export async function updateStoryPhaseImage(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return { success: false, error: "Couple not found" };
  }

  const phase_key = formData.get("phase_key") as StoryPhaseKey;
  const imageTempKey = formData.get("image_temp_key") as string | null;

  if (!phase_key || !imageTempKey) {
    return { success: false, error: "Missing required fields" };
  }

  const { data: existing } = await supabase
    .from("couple_story_phases")
    .select("image_url")
    .eq("couple_id", couple.id)
    .eq("phase_key", phase_key)
    .maybeSingle();

  if (!existing) {
    await deleteFromR2(imageTempKey).catch(() => {});
    return { success: false, error: "Story belum dibuat" };
  }

  const oldImageUrl = existing.image_url as string | null | undefined;
  let basePath: string | null = null;

  try {
    const buffer = await getObject(imageTempKey);

    if (buffer.length > MAX_SIZE) {
      await deleteFromR2(imageTempKey).catch(() => {});
      return { success: false, error: "File terlalu besar (maks 10MB)" };
    }

    const timestamp = Date.now();
    const mediaId = nanoid(8);
    basePath = `users/${user.id}/couples/${couple.id}/story/${phase_key}/${timestamp}_${mediaId}`;

    const displayBuffer = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const thumbBuffer = await sharp(buffer)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

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

    const newImagePath = `${basePath}/display.webp`;

    const { error } = await supabase
      .from("couple_story_phases")
      .update({ image_url: newImagePath })
      .eq("couple_id", couple.id)
      .eq("phase_key", phase_key);

    if (error) throw error;

    await deleteFromR2(imageTempKey).catch(() => {});

    if (oldImageUrl) {
      const baseUrl = (process.env.NEXT_PUBLIC_R2_DOMAIN || "").replace(
        /\/$/,
        "",
      );

      let key: string | null = null;
      if (baseUrl && oldImageUrl.startsWith(baseUrl + "/")) {
        key = oldImageUrl.slice(baseUrl.length + 1);
      } else if (oldImageUrl.startsWith("http")) {
        key = null;
      } else if (oldImageUrl.startsWith("/")) {
        key = null;
      } else {
        key = oldImageUrl;
      }

      if (key) {
        const oldBasePath = key.endsWith("/display.webp")
          ? key.replace("/display.webp", "")
          : null;

        if (oldBasePath) {
          await Promise.allSettled([
            deleteFromR2(`${oldBasePath}/display.webp`),
            deleteFromR2(`${oldBasePath}/thumb.webp`),
          ]);
        } else {
          await deleteFromR2(key).catch(() => {});
        }
      }
    }

    revalidatePath("/story");
    return { success: true, image_path: newImagePath };
  } catch (err: unknown) {
    console.error(err);

    if (basePath) {
      await Promise.allSettled([
        deleteFromR2(`${basePath}/display.webp`),
        deleteFromR2(`${basePath}/thumb.webp`),
      ]);
    }

    await deleteFromR2(imageTempKey).catch(() => {});

    return {
      success: false,
      error: err instanceof Error ? err.message : "Internal Server Error",
    };
  }
}

export async function removeStoryPhaseImage(phase_key: StoryPhaseKey) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return { success: false, error: "Couple not found" };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("couple_story_phases")
    .select("image_url")
    .eq("couple_id", couple.id)
    .eq("phase_key", phase_key)
    .maybeSingle();

  if (fetchError) {
    console.error(fetchError);
    return { success: false, error: fetchError.message };
  }

  if (!existing) {
    return { success: false, error: "Story belum dibuat" };
  }

  const oldImageUrl = existing.image_url as string | null | undefined;

  try {
    const { error } = await supabase
      .from("couple_story_phases")
      .update({ image_url: null })
      .eq("couple_id", couple.id)
      .eq("phase_key", phase_key);

    if (error) throw error;

    if (oldImageUrl) {
      const baseUrl = (process.env.NEXT_PUBLIC_R2_DOMAIN || "").replace(
        /\/$/,
        "",
      );

      let key: string | null = null;
      if (baseUrl && oldImageUrl.startsWith(baseUrl + "/")) {
        key = oldImageUrl.slice(baseUrl.length + 1);
      } else if (oldImageUrl.startsWith("http")) {
        key = null;
      } else if (oldImageUrl.startsWith("/")) {
        key = null;
      } else {
        key = oldImageUrl;
      }

      if (key) {
        const basePath = key.endsWith("/display.webp")
          ? key.replace("/display.webp", "")
          : null;

        if (basePath) {
          await Promise.allSettled([
            deleteFromR2(`${basePath}/display.webp`),
            deleteFromR2(`${basePath}/thumb.webp`),
          ]);
        } else {
          await deleteFromR2(key).catch(() => {});
        }
      }
    }

    revalidatePath("/story");
    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Internal Server Error",
    };
  }
}

export async function updateStoryPhaseVisibility({
  phase_key,
  is_visible,
}: {
  phase_key: StoryPhaseKey;
  is_visible: boolean;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return { success: false, error: "Couple not found" };
  }

  const { data: existing } = await supabase
    .from("couple_story_phases")
    .select("id")
    .eq("couple_id", couple.id)
    .eq("phase_key", phase_key)
    .maybeSingle();

  if (!existing) {
    return { success: false, error: "Story belum dibuat" };
  }

  const { error } = await supabase
    .from("couple_story_phases")
    .update({ is_visible })
    .eq("couple_id", couple.id)
    .eq("phase_key", phase_key);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/story");
  return { success: true };
}

/**
 * Hapus satu story phase
 */
export async function deleteStoryPhase(phase_key: StoryPhaseKey) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!couple) {
    return { success: false, error: "Couple not found" };
  }

  const { data: existing } = await supabase
    .from("couple_story_phases")
    .select("image_url")
    .eq("couple_id", couple.id)
    .eq("phase_key", phase_key)
    .maybeSingle();

  const { error } = await supabase
    .from("couple_story_phases")
    .delete()
    .eq("couple_id", couple.id)
    .eq("phase_key", phase_key);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  const imageUrl = existing?.image_url as string | null | undefined;
  if (imageUrl) {
    const baseUrl = (process.env.NEXT_PUBLIC_R2_DOMAIN || "").replace(
      /\/$/,
      "",
    );

    let key: string | null = null;
    if (baseUrl && imageUrl.startsWith(baseUrl + "/")) {
      key = imageUrl.slice(baseUrl.length + 1);
    } else if (imageUrl.startsWith("http")) {
      key = null;
    } else if (imageUrl.startsWith("/")) {
      key = null;
    } else {
      key = imageUrl;
    }

    if (key) {
      const basePath = key.endsWith("/display.webp")
        ? key.replace("/display.webp", "")
        : null;

      if (basePath) {
        await Promise.allSettled([
          deleteFromR2(`${basePath}/display.webp`),
          deleteFromR2(`${basePath}/thumb.webp`),
        ]);
      } else {
        await deleteFromR2(key).catch(() => {});
      }
    }
  }

  revalidatePath("/story");
  return { success: true };
}
