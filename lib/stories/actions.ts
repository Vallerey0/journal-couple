"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  StoryPhaseKey,
  StoryData,
} from "@/app/(app)/(user)/story/_components/story-config";

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

  const { error } = await supabase.from("couple_story_phases").upsert(
    {
      couple_id: couple.id,
      phase_key,
      title,
      story,
      story_date: story_date || null,
    },
    { onConflict: "couple_id, phase_key" },
  );

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

  const { error } = await supabase
    .from("couple_story_phases")
    .delete()
    .eq("couple_id", couple.id)
    .eq("phase_key", phase_key);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/story");
  return { success: true };
}
