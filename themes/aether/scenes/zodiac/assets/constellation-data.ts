// Data struktur untuk konstelasi bintang zodiak
// Koordinat relatif (0-100) untuk fleksibilitas canvas

export interface StarPoint {
  x: number;
  y: number;
  size?: number; // Optional size variation
}

export interface ConstellationLine {
  from: number; // Index of start star
  to: number; // Index of end star
}

export interface ConstellationData {
  name: string;
  stars: StarPoint[];
  lines: ConstellationLine[];
}

export const CONSTELLATIONS: Record<string, ConstellationData> = {
  aries: {
    name: "Aries",
    stars: [
      { x: 10, y: 50 },
      { x: 30, y: 45 },
      { x: 60, y: 35 },
      { x: 80, y: 30 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
    ],
  },
  taurus: {
    name: "Taurus",
    stars: [
      { x: 50, y: 80 },
      { x: 40, y: 60 },
      { x: 20, y: 40 },
      { x: 60, y: 50 },
      { x: 80, y: 30 },
      { x: 90, y: 20 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ],
  },
  gemini: {
    name: "Gemini",
    stars: [
      { x: 30, y: 20 },
      { x: 70, y: 20 },
      { x: 30, y: 80 },
      { x: 70, y: 80 },
      { x: 50, y: 50 },
    ],
    lines: [
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 3 }, // Simplified
    ],
  },
  cancer: {
    name: "Cancer",
    stars: [
      { x: 20, y: 50 },
      { x: 50, y: 50 },
      { x: 80, y: 20 },
      { x: 50, y: 80 },
      { x: 80, y: 80 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
    ],
  },
  leo: {
    name: "Leo",
    stars: [
      { x: 20, y: 40 },
      { x: 30, y: 20 },
      { x: 50, y: 30 },
      { x: 70, y: 40 },
      { x: 80, y: 60 },
      { x: 60, y: 70 },
      { x: 40, y: 60 },
      { x: 50, y: 50 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
    ],
  },
  virgo: {
    name: "Virgo",
    stars: [
      { x: 20, y: 20 },
      { x: 40, y: 30 },
      { x: 60, y: 40 },
      { x: 50, y: 60 },
      { x: 70, y: 70 },
      { x: 30, y: 80 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 2, to: 5 },
    ],
  },
  libra: {
    name: "Libra",
    stars: [
      { x: 50, y: 20 },
      { x: 20, y: 50 },
      { x: 80, y: 50 },
      { x: 30, y: 80 },
      { x: 70, y: 80 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
    ],
  },
  scorpio: {
    name: "Scorpio",
    stars: [
      { x: 20, y: 30 },
      { x: 30, y: 40 },
      { x: 40, y: 50 },
      { x: 50, y: 60 },
      { x: 60, y: 70 },
      { x: 70, y: 60 },
      { x: 80, y: 50 },
      { x: 90, y: 40 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
    ],
  },
  sagittarius: {
    name: "Sagittarius",
    stars: [
      { x: 20, y: 80 },
      { x: 40, y: 60 },
      { x: 60, y: 40 },
      { x: 80, y: 20 },
      { x: 30, y: 60 },
      { x: 50, y: 40 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 4, to: 5 },
    ],
  },
  capricorn: {
    name: "Capricorn",
    stars: [
      { x: 20, y: 30 },
      { x: 40, y: 50 },
      { x: 60, y: 60 },
      { x: 80, y: 40 },
      { x: 70, y: 20 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 0, to: 4 },
    ],
  },
  aquarius: {
    name: "Aquarius",
    stars: [
      { x: 20, y: 30 },
      { x: 30, y: 40 },
      { x: 40, y: 30 },
      { x: 50, y: 40 },
      { x: 60, y: 30 },
      { x: 70, y: 40 },
      { x: 80, y: 30 },
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
    ],
  },
  pisces: {
    name: "Pisces",
    stars: [
      { x: 20, y: 50 },
      { x: 40, y: 30 },
      { x: 60, y: 50 },
      { x: 80, y: 70 },
      { x: 50, y: 50 },
    ],
    lines: [
      { from: 0, to: 4 },
      { from: 4, to: 3 },
      { from: 1, to: 4 },
      { from: 4, to: 2 },
    ],
  },
};
