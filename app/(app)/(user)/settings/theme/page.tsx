import { createClient } from "@/lib/supabase/server";
import { getThemes } from "@/themes/registry";
import { Sparkles, Palette } from "lucide-react";
import { requireActiveSubscription } from "@/lib/subscriptions/guard";
import ThemeClientPage from "./page-client";

export default async function ThemeSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Ambil theme_code dari tabel COUPLES, bukan profiles
  const { data: couple } = await supabase
    .from("couples")
    .select("theme_code")
    .eq("user_id", user.id)
    .single();

  const allThemes = getThemes();

  // Sanitize themes: remove React components (Preview) before passing to client
  const themes = allThemes.map(({ Preview, ...t }) => t);

  const sub = await requireActiveSubscription();

  return (
    <ThemeClientPage
      themes={themes}
      subscription={sub}
      currentTheme={couple?.theme_code || "aether"}
    />
  );
}
