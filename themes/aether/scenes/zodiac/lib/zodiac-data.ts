export interface ZodiacTrait {
  strength: string;
  challenge: string;
  style: string;
  emotional: string;
}

export interface MonthVariation {
  monthName: string; // e.g., "Maret", "April"
  monthId: number; // 1-12
  traits: ZodiacTrait;
  description: string; // Brief description of this variation
}

export interface ZodiacInfo {
  name: string;
  element: "fire" | "earth" | "air" | "water";
  dateRanges: { from: string; to: string }[]; // MM-DD
  traits: ZodiacTrait; // General traits
  monthVariations: MonthVariation[]; // Specific traits by month
}

export const zodiacData: Record<string, ZodiacInfo> = {
  aries: {
    name: "Aries",
    element: "fire",
    dateRanges: [{ from: "03-21", to: "04-19" }],
    traits: {
      strength: "keberanian dan inisiatif",
      challenge: "kesabaran",
      style: "dinamis dan langsung",
      emotional: "pengakuan dan aksi nyata",
    },
    monthVariations: [
      {
        monthName: "Maret",
        monthId: 3,
        traits: {
          strength: "energi murni dan keberanian tanpa batas",
          challenge: "impulsivitas",
          style: "berapi-api dan spontan",
          emotional: "kebebasan ekspresi",
        },
        description: "Aries Maret adalah perwujudan energi api murni. Diperintah oleh Mars, mereka penuh semangat, berani, dan sering bertindak sebelum berpikir.",
      },
      {
        monthName: "April",
        monthId: 4,
        traits: {
          strength: "kepemimpinan strategis dan kreativitas",
          challenge: "kompromi",
          style: "berkarisma dan ambisius",
          emotional: "pengakuan sosial",
        },
        description: "Aries April memiliki pengaruh Matahari (Leo) atau Jupiter (Sagitarius), membuat mereka lebih strategis, kreatif, dan berorientasi sosial dibanding rekan Maret mereka.",
      },
    ],
  },
  taurus: {
    name: "Taurus",
    element: "earth",
    dateRanges: [{ from: "04-20", to: "05-20" }],
    traits: {
      strength: "kesetiaan dan ketenangan",
      challenge: "fleksibilitas",
      style: "stabil dan sensual",
      emotional: "rasa aman dan kenyamanan",
    },
    monthVariations: [
      {
        monthName: "April",
        monthId: 4,
        traits: {
          strength: "ketahanan dan sensualisme",
          challenge: "keras kepala",
          style: "membumi dan artistik",
          emotional: "kenyamanan fisik",
        },
        description: "Taurus April diperintah sepenuhnya oleh Venus. Mereka adalah definisi klasik Taurus: setia, pecinta keindahan, dan sangat teguh pada pendirian.",
      },
      {
        monthName: "Mei",
        monthId: 5,
        traits: {
          strength: "kecerdasan praktis dan ambisi",
          challenge: "perfeksionisme materi",
          style: "elegan dan terencana",
          emotional: "stabilitas finansial",
        },
        description: "Taurus Mei mendapatkan pengaruh dari Merkurius (Virgo) atau Saturnus (Capricorn), menjadikan mereka lebih analitis, ambisius, dan berorientasi pada kesuksesan jangka panjang.",
      },
    ],
  },
  gemini: {
    name: "Gemini",
    element: "air",
    dateRanges: [{ from: "05-21", to: "06-20" }],
    traits: {
      strength: "adaptasi dan komunikasi",
      challenge: "fokus",
      style: "intelektual dan lincah",
      emotional: "stimulasi mental dan variasi",
    },
    monthVariations: [
      {
        monthName: "Mei",
        monthId: 5,
        traits: {
          strength: "komunikasi cepat dan wawasan luas",
          challenge: "kegelisahan",
          style: "cerewet dan ingin tahu",
          emotional: "pertukaran ide",
        },
        description: "Gemini Mei adalah komunikator ulung yang diperintah murni oleh Merkurius. Mereka sangat cepat menyerap informasi dan suka bersosialisasi.",
      },
      {
        monthName: "Juni",
        monthId: 6,
        traits: {
          strength: "kreativitas dan harmoni sosial",
          challenge: "keragu-raguan",
          style: "bersahabat dan artistik",
          emotional: "koneksi persahabatan",
        },
        description: "Gemini Juni dipengaruhi oleh Venus (Libra) atau Uranus (Aquarius), membuat mereka lebih fokus pada hubungan, keadilan sosial, dan ide-ide humanis.",
      },
    ],
  },
  cancer: {
    name: "Cancer",
    element: "water",
    dateRanges: [{ from: "06-21", to: "07-22" }],
    traits: {
      strength: "intuisi dan kepedulian",
      challenge: "melepaskan masa lalu",
      style: "protektif dan lembut",
      emotional: "koneksi emosional yang dalam",
    },
    monthVariations: [
      {
        monthName: "Juni",
        monthId: 6,
        traits: {
          strength: "empati murni dan kepekaan",
          challenge: "perubahan suasana hati",
          style: "lembut dan mengasuh",
          emotional: "kedekatan keluarga",
        },
        description: "Cancer Juni diperintah oleh Bulan. Mereka sangat sensitif, intuitif, dan sangat terikat pada rumah dan keluarga.",
      },
      {
        monthName: "Juli",
        monthId: 7,
        traits: {
          strength: "ketahanan emosional dan misteri",
          challenge: "menyimpan rahasia",
          style: "intens dan protektif",
          emotional: "transformasi batin",
        },
        description: "Cancer Juli dipengaruhi oleh Pluto (Scorpio) atau Neptunus (Pisces), memberi mereka kedalaman emosi yang lebih intens, daya tahan tinggi, dan sisi misterius.",
      },
    ],
  },
  leo: {
    name: "Leo",
    element: "fire",
    dateRanges: [{ from: "07-23", to: "08-22" }],
    traits: {
      strength: "karisma dan kepemimpinan",
      challenge: "menerima kritik",
      style: "hangat dan ekspresif",
      emotional: "apresiasi dan kekaguman",
    },
    monthVariations: [
      {
        monthName: "Juli",
        monthId: 7,
        traits: {
          strength: "ekspresi diri dan kreativitas",
          challenge: "kebutuhan akan perhatian",
          style: "dramatis dan murah hati",
          emotional: "pujian tulus",
        },
        description: "Leo Juli adalah bintang panggung alami yang diperintah Matahari. Mereka ekspresif, artistik, dan sangat membutuhkan validasi kreatif.",
      },
      {
        monthName: "Agustus",
        monthId: 8,
        traits: {
          strength: "ambisi dan keberanian",
          challenge: "dominasi",
          style: "percaya diri dan berwibawa",
          emotional: "rasa hormat",
        },
        description: "Leo Agustus dipengaruhi oleh Jupiter (Sagitarius) atau Mars (Aries), menjadikan mereka pemimpin yang lebih ambisius, kompetitif, dan berani mengambil risiko.",
      },
    ],
  },
  virgo: {
    name: "Virgo",
    element: "earth",
    dateRanges: [{ from: "08-23", to: "09-22" }],
    traits: {
      strength: "analisis dan dedikasi",
      challenge: "perfeksionisme",
      style: "praktis dan terperinci",
      emotional: "keteraturan dan pelayanan",
    },
    monthVariations: [
      {
        monthName: "Agustus",
        monthId: 8,
        traits: {
          strength: "kecerdasan tajam dan organisasi",
          challenge: "kritik diri",
          style: "efisien dan logis",
          emotional: "kegunaan bagi orang lain",
        },
        description: "Virgo Agustus diperintah oleh Merkurius dengan sentuhan Matahari. Mereka cerdas, sangat terorganisir, namun tetap memiliki sisi hangat dan ekspresif.",
      },
      {
        monthName: "September",
        monthId: 9,
        traits: {
          strength: "ketenangan dan diplomasi",
          challenge: "kekhawatiran berlebih",
          style: "halus dan artistik",
          emotional: "kedamaian pikiran",
        },
        description: "Virgo September dipengaruhi oleh Saturnus (Capricorn) atau Venus (Taurus), membuat mereka lebih stabil, artistik, dan fokus pada kesempurnaan materi.",
      },
    ],
  },
  libra: {
    name: "Libra",
    element: "air",
    dateRanges: [{ from: "09-23", to: "10-22" }],
    traits: {
      strength: "diplomasi dan estetika",
      challenge: "mengambil keputusan",
      style: "harmonis dan sosial",
      emotional: "keseimbangan dan kedamaian",
    },
    monthVariations: [
      {
        monthName: "September",
        monthId: 9,
        traits: {
          strength: "pesona sosial dan keadilan",
          challenge: "konflik",
          style: "elegan dan romantis",
          emotional: "hubungan harmonis",
        },
        description: "Libra September adalah diplomat sejati yang diperintah Venus. Mereka sangat mementingkan keindahan, harmoni, dan hubungan romantis.",
      },
      {
        monthName: "Oktober",
        monthId: 10,
        traits: {
          strength: "intelektual dan kemandirian",
          challenge: "pemberontakan",
          style: "unik dan berprinsip",
          emotional: "kebebasan berpikir",
        },
        description: "Libra Oktober dipengaruhi oleh Uranus (Aquarius) atau Merkurius (Gemini), membuat mereka lebih intelektual, mandiri, dan terkadang sedikit provokatif demi keadilan.",
      },
    ],
  },
  scorpio: {
    name: "Scorpio",
    element: "water",
    dateRanges: [{ from: "10-23", to: "11-21" }],
    traits: {
      strength: "gairah dan ketajaman",
      challenge: "keterbukaan",
      style: "intens dan misterius",
      emotional: "kepercayaan total",
    },
    monthVariations: [
      {
        monthName: "Oktober",
        monthId: 10,
        traits: {
          strength: "intensitas dan transformasi",
          challenge: "kecemburuan",
          style: "magnetis dan kuat",
          emotional: "loyalitas absolut",
        },
        description: "Scorpio Oktober diperintah oleh Pluto/Mars. Mereka sangat intens, magnetis, dan memiliki tekad baja untuk mengungkap kebenaran.",
      },
      {
        monthName: "November",
        monthId: 11,
        traits: {
          strength: "intuisi spiritual dan empati",
          challenge: "ilusi",
          style: "misterius dan lembut",
          emotional: "koneksi jiwa",
        },
        description: "Scorpio November dipengaruhi oleh Neptunus (Pisces) atau Bulan (Cancer), menjadikan mereka lebih sensitif, spiritual, dan emosional dibanding rekan Oktober mereka.",
      },
    ],
  },
  sagittarius: {
    name: "Sagittarius",
    element: "fire",
    dateRanges: [{ from: "11-22", to: "12-21" }],
    traits: {
      strength: "optimisme dan petualangan",
      challenge: "konsistensi",
      style: "bebas dan jujur",
      emotional: "kebebasan bergerak",
    },
    monthVariations: [
      {
        monthName: "November",
        monthId: 11,
        traits: {
          strength: "kebenaran dan filosofi",
          challenge: "taktik bicara",
          style: "jujur dan idealis",
          emotional: "pencarian makna",
        },
        description: "Sagitarius November adalah pencari kebenaran yang diperintah Jupiter. Mereka sangat filosofis, jujur (kadang terlalu jujur), dan idealis.",
      },
      {
        monthName: "Desember",
        monthId: 12,
        traits: {
          strength: "aksi dan inisiatif",
          challenge: "ketidaksabaran",
          style: "energik dan spontan",
          emotional: "tantangan baru",
        },
        description: "Sagitarius Desember dipengaruhi oleh Mars (Aries) atau Matahari (Leo), membuat mereka lebih impulsif, berorientasi tindakan, dan suka menjadi pusat perhatian.",
      },
    ],
  },
  capricorn: {
    name: "Capricorn",
    element: "earth",
    dateRanges: [{ from: "12-22", to: "01-19" }],
    traits: {
      strength: "disiplin dan ambisi",
      challenge: "keseimbangan hidup",
      style: "terstruktur dan serius",
      emotional: "pencapaian nyata",
    },
    monthVariations: [
      {
        monthName: "Desember",
        monthId: 12,
        traits: {
          strength: "ketekunan dan tanggung jawab",
          challenge: "pesimisme",
          style: "tabah dan berwibawa",
          emotional: "rasa hormat sosial",
        },
        description: "Capricorn Desember adalah pekerja keras sejati yang diperintah Saturnus. Mereka sangat disiplin, sabar, dan fokus pada pembangunan fondasi yang kuat.",
      },
      {
        monthName: "Januari",
        monthId: 1,
        traits: {
          strength: "kecerdasan strategis dan inovasi",
          challenge: "standar tinggi",
          style: "logis dan sistematis",
          emotional: "kesuksesan intelektual",
        },
        description: "Capricorn Januari dipengaruhi oleh Venus (Taurus) atau Merkurius (Virgo), membuat mereka lebih santai, logis, dan terkadang memiliki bakat artistik atau komunikasi.",
      },
    ],
  },
  aquarius: {
    name: "Aquarius",
    element: "air",
    dateRanges: [{ from: "01-20", to: "02-18" }],
    traits: {
      strength: "inovasi dan kemanusiaan",
      challenge: "keterikatan emosional",
      style: "unik dan visioner",
      emotional: "kebebasan individual",
    },
    monthVariations: [
      {
        monthName: "Januari",
        monthId: 1,
        traits: {
          strength: "logika dan struktur sosial",
          challenge: "kaku",
          style: "rasional dan objektif",
          emotional: "prinsip yang kuat",
        },
        description: "Aquarius Januari memiliki pengaruh Saturnus yang kuat. Mereka lebih serius, logis, dan ambisius dalam mewujudkan visi masa depan mereka.",
      },
      {
        monthName: "Februari",
        monthId: 2,
        traits: {
          strength: "imajinasi dan empati sosial",
          challenge: "ketidakteraturan",
          style: "artistik dan humanis",
          emotional: "koneksi komunitas",
        },
        description: "Aquarius Februari dipengaruhi oleh Merkurius (Gemini) atau Venus (Libra), menjadikan mereka lebih komunikatif, artistik, dan berorientasi pada pertemanan.",
      },
    ],
  },
  pisces: {
    name: "Pisces",
    element: "water",
    dateRanges: [{ from: "02-19", to: "03-20" }],
    traits: {
      strength: "imajinasi dan empati",
      challenge: "realitas",
      style: "intuitif dan artistik",
      emotional: "pemahaman tanpa kata",
    },
    monthVariations: [
      {
        monthName: "Februari",
        monthId: 2,
        traits: {
          strength: "intuisi mistis dan mimpi",
          challenge: "eskapisme",
          style: "magis dan sensitif",
          emotional: "kedamaian batin",
        },
        description: "Pisces Februari diperintah oleh Neptunus. Mereka adalah pemimpi sejati, sangat sensitif, intuitif, dan sering kali memiliki bakat artistik atau spiritual.",
      },
      {
        monthName: "Maret",
        monthId: 3,
        traits: {
          strength: "transformasi dan keberanian emosional",
          challenge: "intensitas",
          style: "dalam dan puitis",
          emotional: "regenerasi diri",
        },
        description: "Pisces Maret dipengaruhi oleh Bulan (Cancer) atau Pluto (Scorpio), membuat mereka lebih emosional, protektif, dan memiliki daya tahan batin yang kuat.",
      },
    ],
  },
};
