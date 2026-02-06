import { zodiacData } from "./zodiac-data";

type Element = "fire" | "earth" | "air" | "water";

const ELEMENT_COMPATIBILITY: Record<Element, Record<Element, number>> = {
  fire: { fire: 90, air: 95, earth: 70, water: 65 },
  air: { fire: 95, air: 90, earth: 65, water: 70 },
  earth: { fire: 70, air: 65, earth: 90, water: 95 },
  water: { fire: 65, air: 70, earth: 95, water: 90 },
};

export function getCompatibility(
  maleSign: string,
  femaleSign: string,
  dateString: string,
) {
  const maleData = zodiacData[maleSign];
  const femaleData = zodiacData[femaleSign];

  if (!maleData || !femaleData) {
    return { percent: 75, status: "Misterius" };
  }

  // 1. Base Score from Elements
  let baseScore = ELEMENT_COMPATIBILITY[maleData.element][femaleData.element];

  // 2. Daily Fluctuation (Dynamic 65-100% Range)
  // Seed: Date + MaleSign + FemaleSign
  const seedString = `${dateString}-${maleSign}-${femaleSign}`;
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed << 5) - seed + seedString.charCodeAt(i);
    seed |= 0;
  }

  // Create a large fluctuation to ensure the range 65-100 is possible daily
  // We want the result to be heavily influenced by the day (alive feeling)
  const rand = Math.abs(seed);

  // Daily Luck Factor (0 to 35)
  // This allows the score to swing significantly based on the day
  const dailyLuck = rand % 36;

  // Calculate Final Score:
  // We start with 65 (minimum requested) and add the daily luck (up to 35) -> max 100.
  // We also slightly weight it by the base elemental compatibility (to keep some zodiac truth).
  // Formula: 65 + (dailyLuck * 0.8) + ((baseScore - 65) * 0.2)
  // This ensures:
  // - Minimum is around 65 (if dailyLuck is 0 and baseScore is low)
  // - Maximum is around 100 (if dailyLuck is 35 and baseScore is high)
  // - It feels very dynamic/random daily but still favors good matches slightly.

  let finalScore = 65 + dailyLuck * 0.9 + (baseScore - 65) * 0.1;

  // Clamp strictly between 65 and 100
  if (finalScore > 100) finalScore = 100;
  if (finalScore < 65) finalScore = 65;

  // Round to integer
  finalScore = Math.round(finalScore);

  // Determine Status Text
  let status = "";
  if (finalScore >= 95) status = "Pasangan Jiwa (Sempurna)";
  else if (finalScore >= 85) status = "Sangat Harmonis";
  else if (finalScore >= 75) status = "Stabil & Positif";
  else status = "Butuh Pengertian";

  return {
    percent: finalScore,
    status: status,
    elementalSynergy: `${maleData.element} + ${femaleData.element}`,
  };
}
