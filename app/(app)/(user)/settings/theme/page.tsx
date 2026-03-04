import { getThemes } from "@/themes/registry";
import { guardFeatureAccess } from "@/lib/subscriptions/guard";
import ThemeClientPage from "./page-client";

export default async function ThemeSettingsPage() {
  const { couple, subscription: sub } = await guardFeatureAccess();

  const allThemes = getThemes();

  // Sanitize themes: remove React components (Preview) before passing to client
  const themes = allThemes.map(({ Preview, ...t }) => t);

  return (
    <ThemeClientPage
      themes={themes}
      subscription={sub}
      currentTheme={couple.theme_code || "aether"}
    />
  );
}
