// themes/aether/Preview.tsx
"use client";

import dynamic from "next/dynamic";
import MusicPlayer from "./music/MusicPlayer";
import IntroLetter from "./scenes/intro-letter";
import { getPublicMediaUrl } from "@/lib/media/url";

// Dynamic Imports for Heavy Scenes
const ZodiacScene = dynamic(() => import("./scenes/zodiac"), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-black/5" />,
});

const GalleryScene = dynamic(() => import("./scenes/gallery"), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-black/5" />,
});

const StoryScene = dynamic(() => import("./scenes/story"), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-black/5" />,
});

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

  const hasZodiac = !!(data.male_birth_date && data.female_birth_date);
  const hasGallery = galleryItems.length > 0;

  // Define phases to find the first one
  const DEFAULT_PHASES = [
    { key: "how_we_met" },
    { key: "getting_closer" },
    { key: "turning_point" },
    { key: "growing_together" },
    { key: "today" },
  ];

  // Only show story section if there is at least one story with content
  const activeStories = (data.stories || []).filter(
    (s: any) => !!s.title || !!s.story || !!s.story_date,
  );

  const hasStories = activeStories.length > 0;

  // Find first active phase key for transition
  const firstStoryPhase = DEFAULT_PHASES.find((phase) =>
    activeStories.some((s: any) => s.phase_key === phase.key),
  );
  const firstStoryPhaseKey = firstStoryPhase?.key;

  const hasPlaylist = !!(data.playlist && data.playlist.length > 0);

  return (
    <main className="mx-auto w-full max-w-[430px] min-h-screen bg-background relative shadow-2xl overflow-hidden">
      {/* Scene 1: Intro */}
      <section id="intro">
        <IntroLetter couple={data} />
      </section>

      {/* Scene 2: Zodiac */}
      {hasZodiac && (
        <section id="zodiac">
          <ZodiacScene
            male_birthdate={data.male_birth_date || ""}
            female_birthdate={data.female_birth_date || ""}
            male_name={data.male_name}
            female_name={data.female_name}
            hasGallery={hasGallery}
          />
        </section>
      )}

      {/* Scene 3: Gallery */}
      {hasGallery && (
        <section id="gallery">
          <GalleryScene
            gallery={galleryItems}
            hasStories={hasStories}
            firstStoryPhaseKey={firstStoryPhaseKey}
          />
        </section>
      )}

      {/* Scene 4: Story */}
      {hasStories && (
        <section id="story">
          <StoryScene stories={data.stories || []} frameCounts={frameCounts} />
        </section>
      )}

      {/* Music Player - Always render for navigation */}
      <MusicPlayer
        playlist={data.playlist}
        hasZodiac={hasZodiac}
        hasGallery={hasGallery}
        hasStories={hasStories}
      />
    </main>
  );
}
