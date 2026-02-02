// themes/aether/Preview.tsx
"use client";

import IntroLetter from "./scenes/intro-letter";
import ZodiacScene from "./scenes/zodiac";

// Using the actual schema from the project but mapping it to the PreviewProps
// structure the user requested.
type PreviewProps = {
  data: {
    male_name: string;
    female_name: string;
    male_nickname?: string | null;
    female_nickname?: string | null;
    relationship_start_date: string;
    relationship_stage?: string | null;
    married_at?: string | null;
    anniversary_note?: string | null;
    notes?: string | null;
    male_birth_date?: string | null;
    female_birth_date?: string | null;
    male_hobby?: string | null;
    female_hobby?: string | null;
    male_city?: string | null;
    female_city?: string | null;
    show_age?: boolean | null;
    show_zodiac?: boolean | null;
    stories?: any[];
    gallery?: any[];
    playlist?: any[];
    [key: string]: any;
  };
};

export default function Preview({ data }: PreviewProps) {
  return (
    <main>
      {/* Scene 1: Intro Letter */}
      {/* <IntroLetter couple={data} /> */}

      {/* Scene 2: Zodiac */}
      <ZodiacScene
        male_birthdate={data.male_birth_date || ""}
        female_birthdate={data.female_birth_date || ""}
        male_name={data.male_name}
        female_name={data.female_name}
      />

      {/* Scene berikutnya nanti di bawah */}
      {/* <GalleryScene /> */}
    </main>
  );
}
