"use client";

import React, { useLayoutEffect, useRef, useMemo, useEffect } from "react";
import localFont from "next/font/local";
import styles from "./styles.module.css";
import { initStoryMotion } from "./motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronsDown } from "lucide-react";

// Font setup
const dancingScript = localFont({
  src: "../intro-letter/assets/DancingScript-Regular.woff2",
  display: "swap",
  variable: "--font-dancing",
});

// Default Phases config
const DEFAULT_PHASES = [
  { key: "how_we_met", frames: 96 },
  { key: "getting_closer", frames: 96 },
  { key: "turning_point", frames: 96 },
  { key: "growing_together", frames: 96 },
  { key: "today", frames: 96 },
];

interface StoryPhaseData {
  id?: string;
  phase_key: string;
  title?: string;
  story?: string;
  story_date?: string | Date; // Date from DB might be string or Date object
}

interface StorySceneProps {
  stories?: StoryPhaseData[];
  frameCounts?: Record<string, number>;
}

export default function StoryScene({
  stories,
  frameCounts,
}: StorySceneProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Calculate actual phases using props if available, otherwise default
  // Merge frame counts AND story content (title, date)
  const phases = useMemo(() => {
    return DEFAULT_PHASES.map((phase) => {
      // Find matching story data
      const storyData = stories?.find((s) => s.phase_key === phase.key);

      return {
        ...phase,
        frames: frameCounts?.[phase.key] || phase.frames,
        title: storyData?.title,
        date: storyData?.story_date,
        story: storyData?.story,
      };
    });
  }, [frameCounts, stories]);

  useLayoutEffect(() => {
    // Context for cleanup
    const ctx = gsap.context(() => {
      // Store timelines to access previous section's ScrollTrigger
      const timelines: gsap.core.Timeline[] = [];

      sectionRefs.current.forEach((section, index) => {
        if (!section) return;
        const canvas = canvasRefs.current[index];
        if (!canvas) return;

        const config = {
          phase: phases[index].key,
          totalFrames: phases[index].frames,
        };

        const nextSection = sectionRefs.current[index + 1] || undefined;
        const prevSection = sectionRefs.current[index - 1] || undefined;

        // Priority: Use negative values to ensure StoryScene calculates AFTER upstream sections (Intro, Zodiac, Gallery)
        // Intro (10), Zodiac (5), Gallery (0). So Story should be < 0.
        // We still need higher priority for earlier story phases relative to later ones.
        const refreshPriority = -10 - index;

        const tl = initStoryMotion(
          section,
          canvas,
          config,
          nextSection,
          prevSection,
          refreshPriority,
          index === 0, // isFirstPhase
        );

        timelines.push(tl);
      });
    }, containerRef);

    return () => ctx.revert();
  }, [phases]);

  useEffect(() => {
    const handleEnterStory = () => {
      // Allow ScrollTrigger to handle visibility via onEnter to prevent double-reset/flash
      // We trigger a refresh to ensure GSAP catches the scroll position change immediately
      ScrollTrigger.refresh();
    };
    window.addEventListener("enter-story", handleEnterStory);

    // Force refresh on mount to ensure start positions are correct
    // This fixes the issue where user has to scroll down before up
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      window.removeEventListener("enter-story", handleEnterStory);
      clearTimeout(timer);
    };
  }, []);

  // Helper to format date safely
  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      // Use id-ID locale as preferred in core memories to prevent hydration mismatch
      // But ensure it matches server/client. For safety, we can use a fixed format or suppress hydration warning.
      // Given the requirement for "mencolok", simple numeric or text format is fine.
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return null;
    }
  };

  return (
    <div
      className={`${styles.storyContainer} ${dancingScript.variable}`}
      ref={containerRef}
    >
      {phases.map((phase, index) => (
        <section
          key={phase.key}
          className={styles.phaseSection}
          ref={(el: HTMLElement | null) => {
            sectionRefs.current[index] = el;
          }}
        >
          <div className={styles.imageWrapper}>
            <canvas
              ref={(el) => {
                canvasRefs.current[index] = el;
              }}
              className={styles.storyImage}
              // Width and Height will be set by JS logic in motion.ts
              // But we can set a default to avoid layout shift if possible, though CSS handles 100%
            />
          </div>

          {/* Text Overlay - Title, Date, & Story */}
          {(phase.title || phase.date || phase.story) && (
            <div className={styles.textWrapper}>
              <div className={styles.textOverlay}>
                {phase.title && (
                  <h2 className={styles.storyTitle}>{phase.title}</h2>
                )}
                {phase.date && (
                  <div className={styles.storyDate}>{formatDate(phase.date)}</div>
                )}
                {phase.story && <p className={styles.storyText}>{phase.story}</p>}
              </div>

              {/* Scroll Indicator Below Card */}
              <div className={styles.cardScrollIndicator}>
                <ChevronsDown size={20} />
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
