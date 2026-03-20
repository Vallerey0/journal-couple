"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import bookImage from "./book.png";
import cameraImage from "./camera.png";
import bgFontImage from "./bg-font.png";
import flowerOneImage from "./flower-one.png";
import fontImage from "./font.png";
import flowerSakuraImage from "./flower-sakura.png";
import {
  BookPage,
  FilmRoll,
  mergeStoryPhases,
  type StoryPhase,
} from "./story-widgets";

function TornPaperTitle() {
  return (
    <div className="w-full pt-5 md:pt-8">
      <div className="relative left-1/2 w-screen -translate-x-1/2 md:left-auto md:w-[560px] md:max-w-[92%] md:translate-x-0 md:mx-auto">
        <svg
          viewBox="22 0 316 132"
          className="block w-full h-auto drop-shadow-md md:drop-shadow-none overflow-visible"
          role="img"
          aria-label="Our Story"
          preserveAspectRatio="xMidYMin meet"
        >
          <defs>
            <linearGradient id="paper" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFF9FB" />
              <stop offset="100%" stopColor="#FFEFF6" />
            </linearGradient>
            <linearGradient id="ink" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#BE185D" />
              <stop offset="50%" stopColor="#DB2777" />
              <stop offset="100%" stopColor="#9D174D" />
            </linearGradient>
          </defs>

          <g>
            <path
              d="M22 18C22 11.3726 27.3726 6 34 6H326C332.627 6 338 11.3726 338 18V82C334 84 332 86 328 88C324 90 322 94 317 95C312 96 309 92 304 93C299 94 297 98 292 99C287 100 285 96 280 97C275 98 273 102 268 103C263 104 261 100 256 101C251 102 249 106 244 107C239 108 237 104 232 105C227 106 225 110 220 111C215 112 213 108 208 109C203 110 201 114 196 115C191 116 189 112 184 113C179 114 177 118 172 119C167 120 165 116 160 117C155 118 153 122 148 123C143 124 141 120 136 121C131 122 129 126 124 127C119 128 117 124 112 125C107 126 105 130 100 131C95 132 92 128 88 128C84 128 81 132 76 131C71 130 69 126 64 125C59 124 57 128 52 127C47 126 45 122 40 121C35 120 33 124 28 123C25 122 22 120 22 116V18Z"
              fill="url(#paper)"
              stroke="rgba(219,39,119,0.25)"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            <circle cx="60" cy="26" r="6" fill="#FBCFE8" opacity="0.9" />
            <circle cx="74" cy="22" r="4" fill="#FDA4AF" opacity="0.9" />
            <circle cx="92" cy="28" r="5" fill="#FCE7F3" opacity="0.9" />

            <circle cx="300" cy="26" r="6" fill="#FBCFE8" opacity="0.9" />
            <circle cx="286" cy="22" r="4" fill="#FDA4AF" opacity="0.9" />
            <circle cx="268" cy="28" r="5" fill="#FCE7F3" opacity="0.9" />

            <text
              x="180"
              y="56"
              textAnchor="middle"
              fontSize="34"
              fill="url(#ink)"
              style={{
                fontFamily:
                  "var(--font-great-vibes), var(--font-playfair), ui-serif, Georgia, serif",
              }}
            >
              Our Story
            </text>

            <text
              x="180"
              y="76"
              textAnchor="middle"
              fontSize="10"
              letterSpacing="0.25em"
              fill="rgba(190,24,93,0.65)"
              style={{
                fontFamily: "var(--font-playfair), ui-serif, Georgia, serif",
              }}
            >
              SAKURA THEME
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

function StoryBook({ phases }: { phases: StoryPhase[] }) {
  const defaultPhaseKey = phases.find(
    (p) => (p.is_visible ?? true) !== false,
  )?.phase_key;

  const fallbackPhaseKey = useMemo(
    () => defaultPhaseKey || phases[0]?.phase_key || "how_we_met",
    [defaultPhaseKey, phases],
  );

  const [userSelectedPhaseKey, setUserSelectedPhaseKey] = useState<
    string | null
  >(null);

  const selectedPhaseKey = useMemo(() => {
    const candidate = userSelectedPhaseKey || fallbackPhaseKey;
    if (phases.some((p) => p.phase_key === candidate)) return candidate;
    return fallbackPhaseKey;
  }, [fallbackPhaseKey, phases, userSelectedPhaseKey]);

  const selectedPhase = useMemo(
    () => phases.find((p) => p.phase_key === selectedPhaseKey) || phases[0],
    [phases, selectedPhaseKey],
  );

  return (
    <div className="mt-30 md:mt-10">
      <div className="md:hidden relative left-[30%] w-[160%] max-w-[760px] -translate-x-1/2">
        <Image
          src={bgFontImage}
          alt="Handwritten background"
          priority
          sizes="360px"
          draggable={false}
          className="absolute right-[10%] top-[-25%] z-0 w-[360px] h-auto rotate-[8deg] opacity-90 pointer-events-none select-none"
        />
        <Image
          src={flowerOneImage}
          alt="Flower"
          priority
          sizes="220px"
          draggable={false}
          className="absolute right-[4%] top-[-25%] z-[5] w-[280px] h-auto rotate-[10deg] pointer-events-none select-none"
        />
        <FilmRoll
          phases={phases}
          selectedPhaseKey={selectedPhaseKey}
          onSelect={setUserSelectedPhaseKey}
          className="absolute right-[5%] top-[-1%] z-30 w-[clamp(130px,22vw,170px)] rotate-[6deg] md:right-[4%] md:top-[8%]"
        />
        <Image
          src={flowerSakuraImage}
          alt="Sakura"
          priority
          sizes="320px"
          draggable={false}
          className="absolute right-[8%] top-[80%] z-30 w-[260px] h-auto rotate-[6deg] pointer-events-none select-none"
        />
        <Image
          src={fontImage}
          alt="Love of my life"
          priority
          sizes="260px"
          draggable={false}
          className="absolute right-[-1%] top-[76%] z-30 w-[210px] h-auto rotate-[-9deg] pointer-events-none select-none"
        />
        <Image
          src={cameraImage}
          alt="Camera"
          priority
          sizes="96px"
          draggable={false}
          className="absolute left-[25%] top-[-15%] z-20 w-[200px] h-auto -rotate-[-6deg] drop-shadow-lg pointer-events-none select-none"
        />
        <div className="relative z-10 w-full aspect-[4/3] overflow-visible">
          <div className="absolute inset-0 origin-center scale-[1.2] -translate-x-[19%] rotate-[-6deg]">
            <Image
              src={bookImage}
              alt="Story Book"
              fill
              priority
              sizes="(max-width: 768px) 160vw, 960px"
              draggable={false}
              className="object-contain drop-shadow-xl pointer-events-none select-none"
            />
            <BookPage
              phase={selectedPhase}
              className="absolute left-[54%] top-[18%] w-[37%] h-[62%]"
            />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="relative mx-auto w-[min(960px,92%)] aspect-[4/3] rotate-[-6deg]">
          <Image
            src={bgFontImage}
            alt="Handwritten background"
            priority
            sizes="520px"
            draggable={false}
            className="absolute right-[2%] top-[-10%] z-0 w-[520px] h-auto rotate-[8deg] opacity-90 pointer-events-none select-none"
          />
          <Image
            src={flowerOneImage}
            alt="Flower"
            priority
            sizes="300px"
            draggable={false}
            className="absolute right-[-2%] top-[-8%] z-[5] w-[300px] h-auto rotate-[10deg] pointer-events-none select-none"
          />
          <FilmRoll
            phases={phases}
            selectedPhaseKey={selectedPhaseKey}
            onSelect={setUserSelectedPhaseKey}
            className="absolute right-[-4%] top-[0%] z-30 w-[clamp(130px,22vw,170px)] rotate-[6deg] md:right-[4%] md:top-[8%]"
          />
          <Image
            src={flowerSakuraImage}
            alt="Sakura"
            priority
            sizes="420px"
            draggable={false}
            className="absolute right-[0%] top-[66%] z-20 w-[360px] h-auto rotate-[6deg] pointer-events-none select-none"
          />
          <Image
            src={fontImage}
            alt="Love of my life"
            priority
            sizes="360px"
            draggable={false}
            className="absolute right-[6%] top-[58%] z-30 w-[280px] h-auto rotate-[6deg] pointer-events-none select-none"
          />
          <Image
            src={cameraImage}
            alt="Camera"
            priority
            sizes="140px"
            draggable={false}
            className="absolute left-[6%] top-[8%] z-20 w-[110px] h-auto -rotate-6 drop-shadow-lg pointer-events-none select-none"
          />
          <div className="relative z-10 w-full h-full overflow-visible">
            <Image
              src={bookImage}
              alt="Story Book"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 960px"
              draggable={false}
              className="object-contain drop-shadow-xl pointer-events-none select-none"
            />
            <BookPage
              phase={selectedPhase}
              className="absolute left-[53%] top-[18%] w-[38%] h-[64%]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SakuraStory({ phases }: { phases?: StoryPhase[] }) {
  const safePhases = useMemo(() => mergeStoryPhases(phases), [phases]);

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden pb-24">
      <div className="relative z-10 px-0">
        <TornPaperTitle />
        <StoryBook phases={safePhases} />
      </div>
    </div>
  );
}
