"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./styles.module.css";
import localFont from "next/font/local";

gsap.registerPlugin(ScrollTrigger);

// Font setup (matching IntroLetter)
const dancingScript = localFont({
  src: "../intro-letter/assets/DancingScript-Regular.woff2",
  display: "swap",
  variable: "--font-dancing",
});

const PHASE_ORDER = [
  "how_we_met",
  "getting_closer",
  "turning_point",
  "growing_together",
  "today",
];

type StoryData = {
  id: string;
  phase_key: string;
  title: string | null;
  story: string;
  story_date: string | null;
  is_visible: boolean;
};

type StorySceneProps = {
  stories: StoryData[];
  frameCounts?: Record<string, number>;
};

export default function StoryScene({
  stories,
  frameCounts = {},
}: StorySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaseRefs = useRef<(StoryPhaseHandle | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const isReversing = useRef(false);

  // Filter and sort stories based on PHASE_ORDER
  const sortedStories = PHASE_ORDER.map((key) =>
    stories.find((s) => s.phase_key === key),
  ).filter((s): s is StoryData => !!s);

  // Handle Reverse to Gallery (Exit)
  useEffect(() => {
    const handleExitToGallery = () => {
      if (isReversing.current) return;
      isReversing.current = true;
      document.body.style.overflow = "hidden"; // Lock scroll

      // 1. Notify Gallery to Prepare (Show Transition Overlay)
      // This makes the "Transition Image" (which is fixed and full-screen) visible immediately,
      // acting as a curtain to hide the scroll jump.
      window.dispatchEvent(new CustomEvent("return-from-story"));

      // 2. Short delay to ensure overlay renders, then Jump
      setTimeout(() => {
        const gallery = document.getElementById("gallery");
        if (gallery) {
          gallery.scrollIntoView({ behavior: "auto" });

          // 3. Cleanup after transition completes
          // Gallery reverse animation takes ~1.5s total
          setTimeout(() => {
            document.body.style.overflow = "auto";
            isReversing.current = false;
            // Ensure first container is visible for next time (though we didn't hide it)
            const firstContainer = phaseRefs.current[0]?.container;
            if (firstContainer) {
              gsap.set(firstContainer, { scale: 1, opacity: 1 });
            }
          }, 1500);
        } else {
          // Fallback if gallery not found
          document.body.style.overflow = "auto";
          isReversing.current = false;
        }
      }, 50);
    };

    const handleWheel = (e: WheelEvent) => {
      // Check if at start (progress 0) and scrolling up
      if (
        tlRef.current &&
        tlRef.current.progress() < 0.01 && // buffer
        e.deltaY < -5 // Scroll Up
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleExitToGallery();
      }
    };

    // Touch logic
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY; // Positive = Swipe Down (Scroll Up)

      if (
        tlRef.current &&
        tlRef.current.progress() < 0.01 &&
        deltaY > 50 // Swipe Down threshold
      ) {
        // We can't easily preventDefault on touchmove if it's passive,
        // but we can trigger the animation
        if (e.cancelable) e.preventDefault();
        handleExitToGallery();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  useEffect(() => {
    if (sortedStories.length === 0) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=" + sortedStories.length * 400 + "%", // Adjust duration
          pin: true,
          scrub: 1,
        },
      });
      tlRef.current = tl;

      sortedStories.forEach((story, i) => {
        // Phase Refs
        const currentPhase = phaseRefs.current[i];
        if (!currentPhase) return;

        // 1. Transition In (if not first)
        if (i > 0) {
          // Overlap with previous: Start fading in slightly before previous ends
          // Note: The previous one fades out in its own block below
          // We just need to ensure this one is ready

          // Actually, we can handle transition logic here relative to the timeline

          // Current starts hidden/zoomed in? User said "out zoom"
          // "out zoom" usually means zooming out.
          // Maybe Scene A zooms out (gets smaller/fades) -> Scene B zooms in?

          // Let's try: Scene A ends -> Zoom Out/Fade Out. Scene B starts Zoomed In -> Zoom Normal/Fade In.

          tl.fromTo(
            currentPhase.container,
            { opacity: 0, scale: 1.2, pointerEvents: "none", zIndex: i },
            { opacity: 1, scale: 1, pointerEvents: "auto", duration: 0.5 },
            ">-0.2", // Overlap
          );
        } else {
          // First scene: Ensure it's visible
          tl.set(currentPhase.container, {
            opacity: 1,
            scale: 1,
            pointerEvents: "auto",
            zIndex: i,
          });
        }

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

        // 3. Transition Out (if not last)
        if (i < sortedStories.length - 1) {
          // Zoom out and fade
          tl.to(currentPhase.container, {
            opacity: 0,
            scale: 0.8, // Zoom out effect
            pointerEvents: "none",
            duration: 0.5,
          });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [sortedStories]);

  if (sortedStories.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`${dancingScript.variable} ${styles.sceneContainer}`}
      style={{
        height: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {sortedStories.map((story, index) => (
        <StoryPhase
          key={story.id}
          ref={(el) => {
            phaseRefs.current[index] = el;
          }}
          story={story}
          index={index}
          frameCount={frameCounts[story.phase_key] || 144}
        />
      ))}
    </div>
  );
}

// --- StoryPhase Component ---

type StoryPhaseHandle = {
  container: HTMLDivElement | null;
  setFrame: (progress: number) => void;
};

const StoryPhase = forwardRef<
  StoryPhaseHandle,
  { story: StoryData; index: number; frameCount: number }
>(({ story, index, frameCount }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const lastFrameIndexRef = useRef<number>(0);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    container: containerRef.current,
    setFrame: (progress: number) => {
      if (!canvasRef.current || framesRef.current.length === 0) return;

      const frameIndex = Math.min(
        frameCount - 1,
        Math.max(0, Math.floor(progress * (frameCount - 1))),
      );

      renderFrame(frameIndex);

      // Also animate content opacity based on progress?
      // Let's fade content in 0-20% and out 80-100%?
      // Or keep it simple: parent handles container opacity.
      // But maybe we want text to slide up?
      if (contentRef.current) {
        // Simple parallax or fade
        // contentRef.current.style.opacity = progress < 0.1 ? (progress * 10).toString() : "1";
      }
    },
  }));

  // Preload Images
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount === frameCount) {
        setImagesLoaded(true);
        // Initial render
        renderFrame(0);
      }
    };

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(3, "0");
      // Use API route for images: /api/themes/[theme]/[...path]
      // Path maps to: themes/aether/scenes/story/images/[phase]/[file]
      img.src = `/api/themes/aether/scenes/story/images/${story.phase_key}/${paddedIndex}.jpg`;
      img.onload = onImageLoad;
      img.onerror = () => {
        console.warn(`Failed to load frame ${i} for ${story.phase_key}`);
        onImageLoad();
      };
      images.push(img);
    }
    framesRef.current = images;

    return () => {
      framesRef.current = [];
    };
  }, [story.phase_key, frameCount]);

  const renderFrame = (index: number) => {
    lastFrameIndexRef.current = index;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const img = framesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Draw cover logic
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      centerShift_x,
      centerShift_y,
      img.width * ratio,
      img.height * ratio,
    );
  };

  // Resize Handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;

        // Redraw last frame to prevent blank canvas after resize
        if (framesRef.current.length > 0 && imagesLoaded) {
          renderFrame(lastFrameIndexRef.current);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial sizing
    return () => window.removeEventListener("resize", handleResize);
  }, [imagesLoaded]);

  return (
    <div
      ref={containerRef}
      className={styles.container} // Reuse existing styles
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0, // Controlled by parent
        pointerEvents: "none", // Controlled by parent
      }}
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      <div ref={contentRef} className={styles.content}>
        {story.title && <h2 className={styles.title}>{story.title}</h2>}
        {story.story_date && (
          <div className={styles.date}>
            {new Date(story.story_date).toLocaleDateString()}
          </div>
        )}
        <p className={styles.text}>{story.story}</p>
      </div>
      {!imagesLoaded && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
});

StoryPhase.displayName = "StoryPhase";
