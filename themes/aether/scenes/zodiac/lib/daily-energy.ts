export const DAILY_MOODS = [
  "Penuh Semangat", "Reflektif", "Kreatif", "Melankolis", 
  "Produktif", "Romantis", "Tenang", "Ambisius", 
  "Sensitif", "Optimis", "Berani", "Sabar"
];

export const MONTHLY_THEMES = [
  "Awal Baru & Resolusi", // Jan
  "Cinta & Koneksi",      // Feb
  "Pertumbuhan & Inovasi",// Mar
  "Stabilitas & Fondasi", // Apr
  "Eksplorasi & Kebebasan",// May
  "Emosi & Keluarga",     // Jun
  "Ekspresi Diri & Gairah",// Jul
  "Analisis & Perbaikan", // Aug
  "Harmoni & Keseimbangan",// Sep
  "Transformasi & Intimasi",// Oct
  "Petualangan & Wawasan",// Nov
  "Pencapaian & Struktur" // Dec
];

export const LUCKY_COLORS = [
  "Merah Marun", "Biru Langit", "Hijau Zamrud", "Kuning Emas",
  "Ungu Lavender", "Putih Gading", "Hitam Elegan", "Oranye Senja",
  "Merah Muda", "Biru Laut", "Abu-abu Perak", "Coklat Bumi"
];

export const COSMIC_ASPECTS = [
  { name: "Venus Harmonis", effect: "positive", desc: "Energi cinta mengalir lancar" },
  { name: "Mars Dinamis", effect: "neutral", desc: "Gairah tinggi namun perlu kontrol" },
  { name: "Bulan Penuh", effect: "intense", desc: "Emosi memuncak, kejujuran dibutuhkan" },
  { name: "Merkurius Jelas", effect: "positive", desc: "Komunikasi sangat lancar" },
  { name: "Saturnus Menguji", effect: "challenge", desc: "Kesabaran sedang diuji" },
  { name: "Jupiter Membawa Rezeki", effect: "positive", desc: "Keberuntungan berpihak" },
  { name: "Neptunus Bermimpi", effect: "neutral", desc: "Imajinasi tinggi, hindari salah paham" },
  { name: "Pluto Transformasi", effect: "intense", desc: "Perubahan mendalam terjadi" }
];

// Simple deterministic random generator (Linear Congruential Generator)
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function getDailyEnergy(dateString: string, sign: string) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  // Create a seed based on Date + Sign (so each sign has different daily energy)
  const seedString = `${year}-${month}-${day}-${sign}`;
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed << 5) - seed + seedString.charCodeAt(i);
    seed |= 0;
  }
  
  const rand = Math.abs(seed);
  
  // Select attributes based on deterministic random
  const moodIndex = rand % DAILY_MOODS.length;
  const colorIndex = (rand >> 2) % LUCKY_COLORS.length;
  const luckyNumber = (rand % 99) + 1;
  const aspectIndex = (rand >> 3) % COSMIC_ASPECTS.length;

  return {
    dailyMood: DAILY_MOODS[moodIndex],
    monthlyTheme: MONTHLY_THEMES[month],
    luckyColor: LUCKY_COLORS[colorIndex],
    luckyNumber: luckyNumber,
    cosmicAspect: COSMIC_ASPECTS[aspectIndex]
  };
}
