import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

interface StoryConfig {
  phase: string;
  totalFrames: number;
}

export const initStoryMotion = (
  container: HTMLElement,
  imageRef: HTMLImageElement,
  config: StoryConfig,
  nextSection?: HTMLElement,
  prevSection?: HTMLElement,
  prevTotalFrames?: number,
  refreshPriority?: number,
  prevTimeline?: gsap.core.Timeline,
) => {
  const { phase, totalFrames } = config;

  // Initial state
  gsap.set(container, { autoAlpha: 1 });
  gsap.set(imageRef, { scale: 1, filter: "blur(0px)", opacity: 1 });

  // Main Timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: "top top",
      end: `+=${totalFrames * 25}`,
      pin: true,
      scrub: 0.5,
      refreshPriority: refreshPriority || 0,

      // When entering (Forward start or Reverse return), ensure visible
      onEnter: () => {
        gsap.to(container, { autoAlpha: 1, duration: 0.5, overwrite: true });
      },

      // Use onLeave to handle transition to next section
      onLeave: () => {
        if (nextSection) {
          // 1. Animate current section out (Zoom Out, Blur)
          gsap.to(imageRef, {
            scale: 0.85,
            filter: "blur(8px)",
            opacity: 0.7,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => {
              // 2. INSTANTLY move to next section (no scroll duration)
              gsap.set(window, {
                scrollTo: { y: nextSection, autoKill: false },
              });

              // Ensure next section is visible/ready
              gsap.set(nextSection, { autoAlpha: 1 });
              // Fade in next section smoothly
              gsap.fromTo(
                nextSection,
                { opacity: 0 },
                { opacity: 1, duration: 0.5 },
              );
            },
          });
        }
      },

      // Use onLeaveBack to handle transition to previous section
      onLeaveBack: () => {
        if (prevSection) {
          // We are leaving upwards (at start of current section).

          // 1. Force Jump to the exact end of previous section (Last Frame position)
          // Use the previous timeline's ScrollTrigger end position if available
          if (prevTimeline) {
            const prevST = (prevTimeline as any).scrollTrigger;
            if (prevST && prevST.end !== undefined) {
              gsap.set(window, {
                scrollTo: { y: prevST.end, autoKill: false },
              });
            }
          }

          // 2. Fade out CURRENT section immediately to reveal Previous
          gsap.set(container, { autoAlpha: 0 });

          // 3. Find previous image and reset it (Reverse Effect)
          // "Jalankan reverse effect... Langsung pindah"
          const prevImg = prevSection.querySelector("img");
          if (prevImg) {
            gsap.to(prevImg, {
              scale: 1,
              filter: "blur(0px)",
              opacity: 1,
              duration: 0.6,
              ease: "power2.out",
              overwrite: true,
            });
          }
        }
      },

      onEnterBack: () => {
        // We are entering THIS section from the bottom (reversing from next section).
        // Ensure we are visible
        gsap.to(container, { autoAlpha: 1, duration: 0.5, overwrite: true });

        // Reset our state from "Exit" (Zoomed out) to "Normal".
        gsap.to(imageRef, {
          scale: 1,
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          overwrite: true,
        });
      },
    },
  });

  // Frame Scrubbing Logic
  const playhead = { frame: 0 };

  tl.to(playhead, {
    frame: totalFrames - 1,
    ease: "none",
    onUpdate: () => {
      const frameIndex = Math.floor(playhead.frame);
      const frameNum = String(frameIndex + 1).padStart(3, "0");
      const newSrc = `/themes/aether/story/${phase}/${frameNum}.jpg`;
      if (
        imageRef.src !== location.origin + newSrc &&
        imageRef.src.indexOf(newSrc) === -1
      ) {
        imageRef.src = newSrc;
      }
    },
  });

  return tl;
};
