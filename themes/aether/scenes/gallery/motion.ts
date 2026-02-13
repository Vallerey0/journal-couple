import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const buildGalleryTimeline = (
  container: HTMLElement,
  bg: HTMLElement,
  altar: HTMLElement,
  spotlight: HTMLElement,
  cards: HTMLElement[],
  ring: HTMLElement,
  onStart?: () => void,
  onComplete?: () => void,
  onReverse?: () => void,
) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: "top 80%", // Trigger earlier (when top of scene enters viewport)
      toggleActions: "play none play reverse", // Play on enter, reverse on leave back
      refreshPriority: 0, // Lowest priority, calculates last
    },
    delay: 0.5, // Wait for Zodiac jump to settle before starting entrance
    defaults: {
      timeScale: 1.5, // Global speed multiplier for smoother/faster playback
    },
    // No delay needed for "top top" as we arrive via jump.
    // Immediate start prevents "empty" time on reverse.
    onStart: onStart,
    onComplete: onComplete,
    onReverseComplete: () => {
      // Execute callback first (which handles jump and unlock)
      if (onReverse) onReverse();
      // Reset background to initial state to prevent black flash
      gsap.set(bg, { opacity: 0 });
    },
  });

  // Phase 1: Entry (Background Outzoom Blur)
  tl.fromTo(
    bg,
    { scale: 1.5, filter: "blur(20px)", opacity: 0 },
    {
      scale: 1,
      filter: "blur(0px)",
      opacity: 1,
      duration: 1.0, // Faster entry (was 1.5)
      ease: "power2.out",
    },
  )
    // Phase 2: Platform & Atmosphere
    .fromTo(
      altar,
      { y: 200, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, // Faster altar (was 1.2)
      "-=0.6", // Start earlier (was -=0.5)
    )
    .to(spotlight, { opacity: 1, duration: 1.0 }, "-=0.6"); // Faster spotlight (was 1.5)

  // Phase 3: Gallery Cards Spawn (Falling)
  if (cards.length > 0) {
    tl.from(
      cards,
      {
        y: -1000, // Fall from sky
        opacity: 0,
        scale: 0.5,
        duration: 0.8, // Much faster falling (was 1.2)
        stagger: 0.03, // Faster sequence (was 0.05)
        ease: "elastic.out(1, 0.7)", // Slightly snappier elastic
      },
      "-=0.4", // Start almost immediately after BG settles (was -=0.1)
    );
  }

  return tl;
};

export const createOrbitAnimation = (ring: HTMLElement) => {
  // Continuous rotation
  // Start from current rotation if any
  return gsap.to(ring, {
    rotationY: "+=360",
    duration: 30, // Slightly faster (was 40)
    repeat: -1,
    ease: "none",
  });
};
