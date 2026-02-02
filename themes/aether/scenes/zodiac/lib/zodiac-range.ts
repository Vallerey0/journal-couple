import { zodiacData } from "./zodiac-data";

export function getZodiacSignFromDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Helper to compare MM-DD strings
  const checkRange = (start: string, end: string, m: number, d: number) => {
    const [startM, startD] = start.split("-").map(Number);
    const [endM, endD] = end.split("-").map(Number);

    // Simple case: same month range
    if (startM === endM) {
      return m === startM && d >= startD && d <= endD;
    }

    // Cross month range (e.g. 03-21 to 04-19)
    if (m === startM) return d >= startD;
    if (m === endM) return d <= endD;

    return false;
  };

  for (const [sign, data] of Object.entries(zodiacData)) {
    for (const range of data.dateRanges) {
      if (checkRange(range.from, range.to, month, day)) {
        return sign;
      }
    }
  }

  return "capricorn"; // Fallback (should ideally not happen with valid dates)
}
