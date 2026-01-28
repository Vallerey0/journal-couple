import { createClient } from "@/lib/supabase/server";
import { StoryData, StoryPhaseKey } from "../../app/(app)/(user)/story/_components/story-config";

export async function getStoryPhases() {
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

  const { data } = await supabase
    .from("couple_story_phases")
    .select("*")
    .eq("couple_id", couple.id);

  return (data as StoryData[]) || [];
}
