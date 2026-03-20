"use client";

import React, { useEffect, useState } from "react";
import localFont from "next/font/local";
import SakuraIntro from "./scenes/intro";
import SakuraProfile from "./scenes/profile";
import SakuraStory from "./scenes/story";
import { AnimatePresence, motion } from "framer-motion";
import bgDesktop from "./assets/bg-desktop.webp";
import type { StoryPhase } from "./scenes/story/story-widgets";

// Font setup
const greatVibes = localFont({
  src: "./assets/GreatVibes-Regular.woff2",
  display: "swap",
  variable: "--font-great-vibes",
});

const playfair = localFont({
  src: "./assets/PlayfairDisplay-Regular.woff2",
  display: "swap",
  variable: "--font-playfair",
});

interface PreviewProps {
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
    stories?: StoryPhase[];
    gallery?: unknown[];
    playlist?: unknown[];
    male_photo_url?: string | null;
    female_photo_url?: string | null;
    [key: string]: unknown;
  };
  frameCounts?: Record<string, number>;
}

export default function SakuraPreview({ data }: PreviewProps) {
  const [currentScene, setCurrentScene] = useState<"intro" | "profile">(
    "intro",
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
  }, []);

  // Simple mapping for the intro scene
  const introData = {
    couple_name:
      data?.male_name && data?.female_name
        ? `${data.male_nickname || data.male_name} & ${data.female_nickname || data.female_name}`
        : "Sakura Theme",
    ...data,
  };

  const mainStyle = {
    ["--font-great-vibes"]: greatVibes.style.fontFamily,
    ["--font-playfair"]: playfair.style.fontFamily,
    ...(currentScene !== "intro"
      ? {
          backgroundImage: `url(${bgDesktop.src})`,
          backgroundSize: "1200px auto",
          backgroundRepeat: "repeat-y",
          backgroundPosition: "top center",
        }
      : {}),
  } as React.CSSProperties;

  return (
    <main
      className={`w-full min-h-svh relative overflow-x-hidden font-sans`}
      style={mainStyle}
    >
      <AnimatePresence mode="wait">
        {currentScene === "intro" ? (
          <motion.section
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8 }}
            id="intro"
            className="relative h-screen w-full overflow-hidden"
          >
            <SakuraIntro
              data={introData}
              onOpen={() => {
                setCurrentScene("profile");
                window.scrollTo({ top: 0, behavior: "auto" });
              }}
            />
          </motion.section>
        ) : (
          <motion.section
            key="profile"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            id="profile"
            className="relative w-full"
          >
            <SakuraProfile data={data} />
            <section id="story" className="relative w-full pt-6 pb-8">
              <SakuraStory phases={data.stories} />
            </section>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Additional sections can be added here as the theme develops */}
    </main>
  );
}
