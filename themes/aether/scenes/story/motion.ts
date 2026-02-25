import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { navigationState } from "../../navigationState";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

interface StoryConfig {
  phase: string;
  totalFrames: number;
}

export const initStoryMotion = (
  container: HTMLElement,
  imageRef: HTMLCanvasElement,
  config: StoryConfig,
  nextSection?: HTMLElement,
  prevSection?: HTMLElement,
  refreshPriority?: number,
  isFirstPhase?: boolean,
) => {
  const { phase, totalFrames } = config;

  // Canvas Setup
  const canvas = imageRef;
  const ctx = canvas.getContext("2d", { alpha: false }); // Optimization: alpha false if not needed

  // Playhead for scrubbing
  const playhead = { frame: 0 };

  // Image Array
  const images: HTMLImageElement[] = [];

  // ---------------------------------------------------------
  // 1. Draw Helper (Defined FIRST to avoid ReferenceError)
  // ---------------------------------------------------------
  const drawFrame = (index: number) => {
    if (!ctx) return;
    // Safety clamp
    index = Math.max(0, Math.min(index, totalFrames - 1));

    const img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear not needed if drawing full cover, but safe to keep or optimize
    // ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate Cover
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let renderWidth, renderHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      renderWidth = canvasWidth;
      renderHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - renderHeight) / 2;
    } else {
      renderWidth = canvasHeight * imgRatio;
      renderHeight = canvasHeight;
      offsetX = (canvasWidth - renderWidth) / 2;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
  };

  // ---------------------------------------------------------
  // 2. Resize Handler (Depends on drawFrame)
  // ---------------------------------------------------------
  const resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Check if size actually changed to avoid unnecessary clears
    if (
      canvas.width !== rect.width * dpr ||
      canvas.height !== rect.height * dpr
    ) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      // REMOVED: ctx?.scale(dpr, dpr); -- This was causing double scaling (zoom issue) because we use physical width in drawFrame

      // Redraw current frame after resize
      drawFrame(Math.floor(playhead.frame));
    }
  };

  // Initial resize
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas); // Add listener for window resize

  // ---------------------------------------------------------
  // 3. Lazy Load Images with Optimization
  // ---------------------------------------------------------
  const BATCH_SIZE = 6; // Reduced batch size for faster initial load

  const loadImages = () => {
    if (images.length > 0) return; // Already started loading

    // Pre-fill array
    for (let i = 0; i < totalFrames; i++) {
      images[i] = new Image();
    }

    // Load first batch immediately (critical for start)
    loadBatch(0);
  };

  const loadBatch = (startIndex: number) => {
    const endIndex = Math.min(startIndex + BATCH_SIZE, totalFrames);
    let loadedInBatch = 0;

    for (let i = startIndex; i < endIndex; i++) {
      const img = images[i];
      const frameNum = String(i + 1).padStart(3, "0");
      img.src = `/themes/aether/story/${phase}/${frameNum}.jpg`;

      img.onload = () => {
        loadedInBatch++;
        // If this is the very first image, draw it immediately
        if (i === 0 && playhead.frame < 1) {
          drawFrame(0);
        }

        // If batch is done, load next batch
        if (loadedInBatch === endIndex - startIndex) {
          // Small delay to yield to main thread
          if (endIndex < totalFrames) {
            requestAnimationFrame(() => loadBatch(endIndex));
          }
        }
      };

      img.onerror = () => {
        // Even on error, continue loading next batch
        loadedInBatch++;
        if (loadedInBatch === endIndex - startIndex) {
          if (endIndex < totalFrames) {
            requestAnimationFrame(() => loadBatch(endIndex));
          }
        }
      };
    }
  };

  // Immediate load for first phase to prevent black screen
  if (isFirstPhase) {
    loadImages();
    // Force visibility immediately for the first phase so it's seen while scrolling towards it
    gsap.set(container, { autoAlpha: 1 });
  } else {
    // Trigger loading when approaching (1 viewport away) for other phases
    ScrollTrigger.create({
      trigger: container,
      start: "top bottom+=50%", // Reduce lookahead to save resources
      once: true,
      onEnter: loadImages,
    });
  }

  // Initial state
  gsap.set(canvas, { scale: 1, filter: "blur(0px)", opacity: 1 });

  // ---------------------------------------------------------
  // 4. Main Timeline
  // ---------------------------------------------------------
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: "top top",
      end: `+=${totalFrames * 30}`,
      pin: true,
      scrub: 0, // Set to 0 for direct manual control without inertia
      refreshPriority: refreshPriority || 0,

      // When entering (Forward start or Reverse return), ensure visible
      onEnter: () => {
        gsap.to(container, { autoAlpha: 1, duration: 0, overwrite: true }); // Instant show
        // Ensure canvas is visible and reset from any previous exit state
        gsap.set(canvas, {
          scale: 1,
          filter: "blur(0px)",
          opacity: 1,
          overwrite: true,
        });
        resizeCanvas();
        drawFrame(Math.floor(playhead.frame));

        // Ensure loading started if not already (redundant but safe)
        loadImages();
      },

      onEnterBack: () => {
        gsap.to(container, { autoAlpha: 1, duration: 0, overwrite: true }); // Instant show on reverse
        gsap.set(canvas, {
          scale: 1,
          filter: "blur(0px)",
          opacity: 1,
          overwrite: true,
        });
        resizeCanvas();
        // Force draw the last frame immediately when entering back from bottom
        drawFrame(totalFrames - 1);
      },

      // Use onLeave to handle transition to next section
      onLeave: () => {
        if (navigationState.isNavigating) return;
        if (!nextSection) return;

        navigationState.isNavigating = true;
        if (typeof document !== "undefined") {
          document.body.style.overflow = "hidden";
        }

        // User requested "jump" transition, so we minimize duration
        gsap.to(canvas, {
          scale: 0.95, // Subtle zoom out
          filter: "blur(5px)",
          opacity: 0,
          duration: 0.5, // Faster fade out
          ease: "power2.inOut",
          onComplete: () => {
            // Instant jump to next section
            nextSection.scrollIntoView({ behavior: "auto" }); // Instant jump
            gsap.set(nextSection, { autoAlpha: 1 });

            if (typeof document !== "undefined") {
              document.body.style.overflow = "auto";
            }
            navigationState.isNavigating = false;
          },
        });
      },

      // Use onLeaveBack to handle transition to previous section
      onLeaveBack: () => {
        if (navigationState.isNavigating) return;

        // We are moving to a previous Story phase
        if (prevSection) {
          navigationState.isNavigating = true;
          if (typeof document !== "undefined") {
            document.body.style.overflow = "hidden";
          }

          // Fade out current
          gsap.to(container, { autoAlpha: 0, duration: 0.3 });

          // Snap back to previous section
          prevSection.scrollIntoView({ behavior: "auto", block: "end" });
          // Aligns bottom of previous with bottom of viewport (last frame feel)

          setTimeout(() => {
            if (typeof document !== "undefined") {
              document.body.style.overflow = "auto";
            }
            navigationState.isNavigating = false;
          }, 400);
        } else {
          // NO prevSection means we are at the FIRST phase.
          // We are exiting Story Mode back to Gallery.

          navigationState.isNavigating = true;
          if (typeof document !== "undefined") {
            document.body.style.overflow = "hidden";
          }

          // 1. Dispatch event to wake up Gallery
          window.dispatchEvent(new Event("return-from-story"));

          // 2. Reset Playhead to 0 for a fresh start when user returns
          playhead.frame = 0;
          drawFrame(0);

          // Let Gallery own the next scroll state; clear navigating after a short delay
          setTimeout(() => {
            navigationState.isNavigating = false;
          }, 800);
        }
      },
    },
  });

  // Animate Playhead
  tl.to(playhead, {
    frame: totalFrames - 1,
    ease: "none",
    onUpdate: () => {
      drawFrame(Math.floor(playhead.frame));
    },
  });

  // Cleanup
  ScrollTrigger.create({
    trigger: container,
    onKill: () => {
      window.removeEventListener("resize", resizeCanvas);
    },
  });

  return tl;
};
