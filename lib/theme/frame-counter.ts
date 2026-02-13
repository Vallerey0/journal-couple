import { promises as fs } from "fs";
import path from "path";

export async function getStoryFrameCounts(theme: string) {
  const phases = [
    "how_we_met",
    "getting_closer",
    "turning_point",
    "growing_together",
    "today",
  ];

  const counts: Record<string, number> = {};

  for (const phase of phases) {
    let frameCount = 0;

    // Try public/themes first (legacy/current standard)
    const publicDir = path.join(
      process.cwd(),
      "public",
      "themes",
      theme,
      "story",
      phase,
    );

    // Check themes/ (new standard)
    const themeDir = path.join(process.cwd(), "themes", theme, "story", phase);

    try {
      // Try public first
      const publicFiles = await fs.readdir(publicDir).catch(() => []);
      const publicImages = publicFiles.filter((f) =>
        /\.(jpg|jpeg|png|webp)$/i.test(f),
      );

      if (publicImages.length > 0) {
        frameCount = publicImages.length;
      } else {
        // Try themes dir if public is empty or missing
        const themeFiles = await fs.readdir(themeDir).catch(() => []);
        const themeImages = themeFiles.filter((f) =>
          /\.(jpg|jpeg|png|webp)$/i.test(f),
        );

        if (themeImages.length > 0) {
          frameCount = themeImages.length;
        }
      }
    } catch (e) {
      console.error(`Error counting frames for ${theme}/${phase}:`, e);
    }

    if (frameCount > 0) {
      counts[phase] = frameCount;
    } else {
      // If no frames found, we don't set the key, letting the component fallback to default (currently 144)
      // or we could set it to 0 if we want to explicitly say "no frames".
      // Given the component uses || 144, 0 would also fallback to 144.
      // So we just leave it or set to 0, effect is same.
      // But let's log it for debugging.
      // console.warn(`No frames found for ${theme}/${phase}`);
    }
  }

  return counts;
}
