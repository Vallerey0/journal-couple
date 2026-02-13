// themes/aether/Preview.tsx
"use client";

import IntroLetter from "./scenes/intro-letter";
import ZodiacScene from "./scenes/zodiac";
import GalleryScene from "./scenes/gallery";
import StoryScene from "./scenes/story";
import { getPublicMediaUrl } from "@/lib/media/url";

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
  frameCounts?: Record<string, number>;
};

export default function Preview({ data, frameCounts }: PreviewProps) {
  // Map gallery data to the format expected by GalleryScene
  const galleryItems = (data.gallery || []).map((item: any) => ({
    image: getPublicMediaUrl(item.image_path) || "",
    title: item.journal_title || "",
    date: item.taken_at || "",
    description: item.journal_text || "",
  }));

  return (
    <main className="mx-auto w-full max-w-[430px] min-h-screen bg-background relative shadow-2xl overflow-hidden">
      {/* Scene 1: Intro */}
      <section id="intro">
        <IntroLetter couple={data} />
      </section>

      {/* Scene 2: Zodiac */}
      <section id="zodiac">
        <ZodiacScene
          male_birthdate={data.male_birth_date || ""}
          female_birthdate={data.female_birth_date || ""}
          male_name={data.male_name}
          female_name={data.female_name}
        />
      </section>

      {/* Scene 3: Gallery */}
      <section id="gallery">
        <GalleryScene gallery={galleryItems} />
      </section>

      {/* Scene 4: Story */}
      <section id="story">
        <StoryScene stories={data.stories || []} frameCounts={frameCounts} />
      </section>
    </main>
  );
}
