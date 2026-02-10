import fs from "fs";
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
    const dir = path.join(process.cwd(), "themes", theme, "scenes", "story", "images", phase);
    try {
      if (fs.existsSync(dir)) {
        const files = await fs.promises.readdir(dir);
        // Count only images, exclude .DS_Store or others
        const imageCount = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).length;
        counts[phase] = imageCount;
      } else {
        counts[phase] = 0;
      }
    } catch (e) {
      console.error(`Error counting frames for ${theme}/${phase}:`, e);
      counts[phase] = 0;
    }
  }

  return counts;
}
