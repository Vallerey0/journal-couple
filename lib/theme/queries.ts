import "server-only";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

/* 
  Data fetcher khusus untuk Theme Preview.
  Memisahkan logic ini dari CRUD Couples biasa.
*/

export const getCoupleForTheme = cache(async (slug: string) => {
  const supabase = await createClient();

  // 1. Sanitasi slug
  const cleanSlug = slug.trim();

  // 2. Query ke table couples
  //    Pastikan RLS policy "couples_public_read" sudah aktif di Supabase
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .eq("slug", cleanSlug)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    console.error("[getCoupleForTheme] Error:", error);
    return null;
  }

  return data;
});
