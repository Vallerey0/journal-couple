import { StaticImageData } from "next/image";
import aether from "./aether/theme.config";
import fire from "./fire/theme.config";

export type Theme = {
  code: string;
  name: string;
  description: string;
  isPremium: boolean;
  tags: string[];
  author: string;
  version: string;
  releaseAt?: string; // Format: "DD-MM-YYYY" (e.g., "01-04-2026")
  thumbnail: StaticImageData;
  Preview: React.ComponentType<any>;
};

const THEMES: Theme[] = [aether, fire];

export const getThemes = (): Theme[] => THEMES;

export const getTheme = (code: string): Theme | undefined =>
  THEMES.find((t) => t.code === code);

/**
 * Helper untuk parsing tanggal format "DD-MM-YYYY"
 * Contoh: "01-04-2026" -> Date object
 */
export function parseReleaseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("-").map(Number);
  // Month di JS 0-indexed (0 = Januari, 3 = April)
  return new Date(year, month - 1, day);
}

export function isThemeReleased(theme: { releaseAt?: string }): boolean {
  if (!theme.releaseAt) return true;

  // Bandingkan tanggal rilis dengan hari ini (tanpa jam)
  const releaseDate = parseReleaseDate(theme.releaseAt);
  const today = new Date();

  // Reset jam untuk perbandingan tanggal murni
  today.setHours(0, 0, 0, 0);
  releaseDate.setHours(0, 0, 0, 0);

  return today >= releaseDate;
}
