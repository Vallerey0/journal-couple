import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StoryData } from "@/app/(app)/(user)/story/_components/story-config";

gsap.registerPlugin(ScrollTrigger);

export type StoryPhaseHandle = {
  container: HTMLDivElement | null;
  content: HTMLDivElement | null;
  setFrame: (progress: number) => void;
};

interface InitStoryMotionParams {
  container: HTMLDivElement;
  sortedStories: StoryData[];
  phaseRefs: React.MutableRefObject<(StoryPhaseHandle | null)[]>;
}

export const initStoryMotion = ({
  container,
  sortedStories,
  phaseRefs,
}: InitStoryMotionParams) => {
  const ctx = gsap.context((self) => {
    // Determine the scroll distance based on number of stories
    // 250% per story provides a more comfortable scroll pace (reduced from 400%)
    const scrollDistance = sortedStories.length * 250;

    const tl = gsap.timeline();

    // Assign to outer variable for return
    // We assign it here to ensure it's captured
    // @ts-ignore
    self.data.tl = tl;

    sortedStories.forEach((story, i) => {
      // Phase Refs
      const currentPhase = phaseRefs.current[i];
      if (!currentPhase) return;

      // 1. Transition In (if not first)
      if (i > 0) {
        tl.fromTo(
          currentPhase.container,
          { opacity: 0, scale: 1.05, pointerEvents: "none", zIndex: i },
          {
            opacity: 1,
            scale: 1,
            pointerEvents: "auto",
            duration: 0.05, // Almost instant for image
            onStart: () => currentPhase.setFrame(0), // Ensure first frame is shown immediately
          },
          ">-0.1", // Overlap
        );

        // Text Entrance Animation
        if (currentPhase.content) {
          tl.fromTo(
            currentPhase.content,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
            "<0.1", // Start shortly after container starts
          );
        }
      } else {
        // First scene: Ensure it's visible
        tl.set(currentPhase.container, {
          opacity: 1,
          scale: 1,
          pointerEvents: "auto",
          zIndex: i,
        });

        // Optional: Ensure text is reset if scrolling back
        if (currentPhase.content) {
          tl.set(currentPhase.content, { opacity: 1, y: 0 });
        }
      }

      // Add a label at the start of the story content (after transition)
      // This allows ScrollTrigger to snap exactly to this point
      tl.addLabel(`story-${i}`);

      // 2. Play Content (Frame Animation)
      const proxy = { frameProgress: 0 };
      tl.to(proxy, {
        frameProgress: 1,
        duration: 2, // Relative duration for reading content
        ease: "none",
        onUpdate: () => {
          currentPhase.setFrame(proxy.frameProgress);
        },
      });

      // Add a label at the end of the story content
      // This ensures that when scrolling back, we snap to the end of the previous story
      tl.addLabel(`story-${i}-end`);

      // 3. Transition Out (if not last)
      if (i < sortedStories.length - 1) {
        // Fade out without zoom to prevent "retreating" feel
        tl.to(currentPhase.container, {
          opacity: 0,
          // scale: 0.8, // Removed zoom out as per user feedback
          pointerEvents: "none",
          duration: 0.3,
        });
      }
    });

    // Create ScrollTrigger with custom Snap logic
    ScrollTrigger.create({
      animation: tl,
      trigger: container,
      start: "top top",
      end: "+=" + scrollDistance + "%",
      pin: true,
      scrub: 0, // Instant scrubbing for direct control
      snap: {
        snapTo: (progress, self) => {
          const totalDur = tl.duration();
          if (!totalDur) return progress;

          // Define ranges where manual scrolling is allowed (Content zones)
          // Range is from `story-i` (Start) to `story-i-end` (End)
          const ranges = sortedStories.map((_, i) => ({
            start: tl.labels[`story-${i}`] / totalDur,
            end: tl.labels[`story-${i}-end`] / totalDur,
          }));

          // Check if current progress is inside a content range
          for (const range of ranges) {
            // Add a tiny buffer to allow snapping to exact start/end
            if (
              progress >= range.start - 0.001 &&
              progress <= range.end + 0.001
            ) {
              return progress; // Manual control inside scenes
            }
          }

          // Directional Snap Logic for Transition Zones
          // Collect all boundary points
          const boundaries: number[] = [];
          ranges.forEach((r) => {
            boundaries.push(r.start);
            boundaries.push(r.end);
          });
          boundaries.sort((a, b) => a - b);

          // Find the nearest forward and backward boundaries
          const nextBoundary = boundaries.find((p) => p > progress + 0.0001);
          const prevBoundary = [...boundaries]
            .reverse()
            .find((p) => p < progress - 0.0001);

          if (self && self.direction > 0 && nextBoundary !== undefined) {
            return nextBoundary;
          }
          if (self && self.direction < 0 && prevBoundary !== undefined) {
            return prevBoundary;
          }

          // Fallback to closest if direction is 0 or boundaries undefined
          const closest = boundaries.reduce((prev, curr) =>
            Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev,
          );

          return closest;
        },
        duration: { min: 0.2, max: 0.5 }, // Faster snap
        delay: 0, // Instant snap
        ease: "power1.inOut",
      },
    });
  }, container);

  // @ts-ignore
  return { ctx, tl: ctx.data.tl as gsap.core.Timeline };
};
