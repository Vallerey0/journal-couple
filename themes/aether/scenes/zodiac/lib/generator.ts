import { ZodiacInfo, MonthVariation } from "./zodiac-data";

interface DailyContext {
  mood: string;
  theme: string;
  luckyColor: string;
  cosmicAspect: { name: string; effect: string; desc: string };
}

interface CompatibilityContext {
  percent: number;
  status: string;
}

export function generateHoroscope(
  signData: ZodiacInfo,
  context: DailyContext,
  variation?: MonthVariation,
): string {
  // Use specific traits if available, otherwise fallback to general traits
  const traits = variation ? variation.traits : signData.traits;

  // Template variations based on daily mood
  const templates = [
    `Energi hari ini membawa suasana ${context.mood.toLowerCase()}. Kekuatan ${traits.strength} Anda akan sangat membantu dalam menghadapi tantangan ${traits.challenge}.`,
    `Fokuslah pada ${context.theme.toLowerCase()}. Dengan gaya ${traits.style}, Anda bisa menemukan ${context.mood.toLowerCase()} di tengah kesibukan.`,
    `Warna ${context.luckyColor.toLowerCase()} membawa keberuntungan. Hari yang tepat untuk memenuhi kebutuhan emosional akan ${traits.emotional}.`,
    `Di bawah naungan energi ${context.theme}, sifat ${traits.strength} Anda sedang memuncak. Tetaplah ${traits.style}.`,
  ];

  // Deterministic selection based on length of strings (simple hash)
  const index = (context.mood.length + signData.name.length) % templates.length;
  let horoscope = templates[index];

  // Add Cosmic Aspect Influence
  horoscope += ` Aspek ${context.cosmicAspect.name} hari ini mengingatkan bahwa ${context.cosmicAspect.desc.toLowerCase()}.`;

  // Enrich with month-specific description if available
  if (variation) {
    horoscope += ` \n\nSebagai ${signData.name} bulan ${variation.monthName}, ${variation.description}`;
  }

  return horoscope;
}

export function generateCoupleSummary(
  maleData: ZodiacInfo,
  femaleData: ZodiacInfo,
  comp: CompatibilityContext,
  maleVariation?: MonthVariation,
  femaleVariation?: MonthVariation,
): string {
  const maleTraits = maleVariation ? maleVariation.traits : maleData.traits;
  const femaleTraits = femaleVariation
    ? femaleVariation.traits
    : femaleData.traits;

  // Paragraf 1: Dinamika dasar berdasarkan elemen dan gaya
  const intro = `Hari ini ${maleData.name} dan ${femaleData.name} berada dalam fase yang sangat ${comp.status.toLowerCase()}. ${maleData.name} membawa energi ${maleTraits.strength} yang kuat, sementara ${femaleData.name} menyeimbangkannya dengan ${femaleTraits.style}.`;

  // Paragraf 2: Fokus pada emosi dan solusi hubungan
  const dynamic = `Hubungan ini diuntungkan oleh kemampuan kalian untuk saling mengisi. ${maleData.name} perlu memahami kebutuhan ${femaleData.name} akan ${femaleTraits.emotional}, sedangkan ${femaleData.name} bisa belajar dari ${maleTraits.challenge} pasangannya. Dengan kecocokan ${comp.percent}%, kunci keharmonisan kalian adalah saling mendengarkan dan menyelaraskan tujuan bersama.`;

  // Paragraf 3: Daily Tip based on Percentage (Dynamic)
  let dailyTip = "";
  if (comp.percent >= 90) {
    dailyTip =
      "Langit mendukung hubungan kalian sepenuhnya hari ini! Manfaatkan energi ini untuk merencanakan masa depan atau sekadar menikmati momen romantis yang mendalam.";
  } else if (comp.percent >= 80) {
    dailyTip =
      "Energi kosmis sangat positif. Sedikit perhatian ekstra akan membuat hari ini menjadi kenangan yang indah.";
  } else if (comp.percent >= 70) {
    dailyTip =
      "Hari ini cukup stabil, namun hindari perdebatan kecil. Fokus pada kesamaan tujuan dan saling mendukung.";
  } else {
    dailyTip =
      "Tantangan kosmis mungkin terasa hari ini. Bersabarlah dan gunakan komunikasi yang lembut untuk melewati hari ini dengan baik.";
  }

  return `${intro}\n\n${dynamic}\n\n${dailyTip}`;
}
