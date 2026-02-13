"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./styles.module.css";
import fullscreenStyles from "./fullscreenStyles.module.css";
import { initLightCanvas } from "./canvasLight";
import { initFogCanvas } from "./canvasSmoke";
import { calculateOrbitPosition } from "./orbitMath";
import { buildGalleryTimeline, createOrbitAnimation } from "./motion";
import galleryBgSrc from "./assets/gallery-bg.jpg";

interface GalleryItem {
  image: string | null;
  title: string;
  date: string;
  description: string;
}

interface GallerySceneProps {
  gallery?: GalleryItem[];
}

export default function GalleryScene({ gallery = [] }: GallerySceneProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);

  const canvasLightRef = useRef<HTMLCanvasElement>(null);
  const canvasSmokeRef = useRef<HTMLCanvasElement>(null);
  const altarRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const overlayCardRef = useRef<HTMLDivElement>(null);
  const activeCardIndexRef = useRef<number | null>(null);
  const isIntroCompleteRef = useRef(false);
  const canReverseRef = useRef(false); // Grace period ref
  const isDraggingRef = useRef(false); // Ref for event listeners
  const isSceneStableRef = useRef(false); // Global safety lock on mount
  const isAutoScrolling = useRef(false); // Prevent multiple triggers
  const transitionImageRef = useRef<HTMLDivElement>(null); // Ref for exit transition image
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isTouchingRef = useRef(false);

  // State
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<{
    rect: DOMRect;
    item: GalleryItem;
    index: number;
  } | null>(null);
  const orbitTweenRef = useRef<gsap.core.Tween | null>(null);
  const exitTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Sync Refs
  useEffect(() => {
    activeCardIndexRef.current = activeCardIndex;
  }, [activeCardIndex]);

  // Global Safety Lock on Mount
  useEffect(() => {
    // Prevent any reverse navigation for the first 0.5 seconds after mount
    // This fixes the "immediate redirect" issue on mobile
    const timer = setTimeout(() => {
      isSceneStableRef.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Responsive State
  const [radius, setRadius] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const dragStartX = useRef(0);
  const currentRotation = useRef(0);

  // Handle Resize & Dynamic Radius
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const cardWidth = isMobile ? 100 : 200; // From CSS (Updated)
      const count = gallery.length;

      // Default base radius
      const baseRadius = isMobile ? 120 : 300;

      // Calculate required radius to fit all cards without excessive overlap
      // Circumference C = 2 * pi * r  =>  r = C / (2 * pi)
      // We want C approx count * cardWidth
      // We multiply by 1.1 to allow slight GAP for a cohesive "ring" look
      const minCircumference = count * cardWidth * 1.1;
      const calculatedRadius = minCircumference / (2 * Math.PI);

      // Use the larger of the two
      setRadius(Math.max(baseRadius, calculatedRadius));
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gallery.length]);

  // Listen for "enter-gallery" event from Zodiac (Hard Jump Trigger)
  useEffect(() => {
    const handleEnterGallery = () => {
      // 1. Reset State
      setIsIntroComplete(false);
      isIntroCompleteRef.current = false;
      canReverseRef.current = false;

      // 2. Kill Orbit if running (it shouldn't be, but safety first)
      orbitTweenRef.current?.kill();
      orbitTweenRef.current = null;

      // 3. Restart Timeline from 0
      if (timelineRef.current) {
        // Pause first to prevent fighting
        timelineRef.current.pause(0);
        // Force restart with delay
        setTimeout(() => {
          timelineRef.current?.restart(true);
        }, 100);
      }
    };

    window.addEventListener("enter-gallery", handleEnterGallery);
    return () =>
      window.removeEventListener("enter-gallery", handleEnterGallery);
  }, []);

  // Listen for "return-from-story" event
  useEffect(() => {
    const handleReturnFromStory = () => {
      // 1. Show Gallery Immediately
      if (containerRef.current) {
        gsap.set(containerRef.current, { opacity: 1, pointerEvents: "auto" });
        // Smoothly scroll to Gallery top
        containerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      // 2. Reverse Exit Animation (Smooth)
      if (exitTimelineRef.current) {
        // Reverse the exit timeline to bring cards back gracefully
        exitTimelineRef.current.reverse();
      }

      // 3. Ensure overflow is hidden (Gallery uses wheel events)
      document.body.style.overflow = "hidden";

      // 4. Resume Orbit
      if (ringRef.current && activeCardIndexRef.current === null) {
        orbitTweenRef.current?.kill();
        orbitTweenRef.current = createOrbitAnimation(ringRef.current);
      }

      // 5. Unlock interaction
      isAutoScrolling.current = false;

      // Force resize to ensure layout is correct
      window.dispatchEvent(new Event("resize"));
    };

    window.addEventListener("return-from-story", handleReturnFromStory);
    return () =>
      window.removeEventListener("return-from-story", handleReturnFromStory);
  }, []);

  // Update card positions when radius changes (or gallery loads)
  useEffect(() => {
    if (gallery.length > 0 && ringRef.current) {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        // Skip the active card so we don't overwrite its open state
        if (i === activeCardIndex) return;

        const pos = calculateOrbitPosition(i, gallery.length, radius);

        // Animate to new position smoothly if radius changes
        gsap.to(card, {
          x: pos.x,
          z: pos.z,
          rotationY: pos.rotationY,
          scale: 1, // Reset scale to 1 so CSS perspective handles the depth
          duration: 0.5,
          ease: "power2.out",
        });
      });
    }
  }, [radius, gallery, activeCardIndex]);

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isIntroComplete || activeCardIndex !== null) return; // Disable interaction during intro or if card is open
    setIsDragging(true);
    isDraggingRef.current = true;
    dragStartX.current = e.clientX;
    if (ringRef.current) {
      currentRotation.current = gsap.getProperty(
        ringRef.current,
        "rotationY",
      ) as number;
    }
    // Pause auto-orbit on interaction
    orbitTweenRef.current?.pause();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !ringRef.current || activeCardIndex !== null) return;

    const delta = e.clientX - dragStartX.current;
    // Sensitivity factor: faster on mobile
    const sensitivity = window.innerWidth < 768 ? 0.5 : 0.3;

    gsap.set(ringRef.current, {
      rotationY: currentRotation.current + delta * sensitivity,
    });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    isDraggingRef.current = false;

    // Resume auto-orbit from current position
    // We kill the old tween and start a new one to avoid snapping
    if (ringRef.current && activeCardIndex === null) {
      orbitTweenRef.current?.kill();
      orbitTweenRef.current = createOrbitAnimation(ringRef.current);
    }
  };

  // Initialize Scene
  useEffect(() => {
    // Canvas
    const cleanupLight =
      canvasLightRef.current && initLightCanvas(canvasLightRef.current);
    const cleanupSmoke =
      canvasSmokeRef.current && initFogCanvas(canvasSmokeRef.current);

    // Initial Positions
    if (gallery.length > 0 && ringRef.current) {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        const pos = calculateOrbitPosition(i, gallery.length, radius);

        // Set initial transform
        gsap.set(card, {
          x: pos.x,
          z: pos.z,
          rotationY: pos.rotationY,
          scale: 1,
        });
      });
    }

    // Set Initial State for Motion Elements (Prevent FOUC)
    if (bgRef.current && altarRef.current && spotlightRef.current) {
      gsap.set(bgRef.current, { opacity: 0, scale: 1.5, filter: "blur(20px)" });
      gsap.set(altarRef.current, { y: 200, opacity: 0 });
      gsap.set(spotlightRef.current, { opacity: 0 });
    }

    // Main Timeline
    if (
      containerRef.current &&
      bgRef.current &&
      altarRef.current &&
      spotlightRef.current &&
      ringRef.current
    ) {
      const validCards = cardsRef.current.filter(
        (c) => c !== null,
      ) as HTMLElement[];

      timelineRef.current = buildGalleryTimeline(
        containerRef.current,
        bgRef.current,
        altarRef.current,
        spotlightRef.current,
        validCards,
        ringRef.current,
        () => {
          // On Start (Intro Animation)
          document.body.style.overflow = "hidden";
        },
        () => {
          // On Intro Complete
          setIsIntroComplete(true);
          isIntroCompleteRef.current = true;
          // document.body.style.overflow = "auto"; // KEEP HIDDEN to prevent native scroll

          // Add grace period before allowing reverse (prevents accidental bounce-back)
          setTimeout(() => {
            canReverseRef.current = true;
          }, 500); // Reduced from 1500ms to 500ms for better responsiveness

          // Start Orbit
          if (ringRef.current) {
            orbitTweenRef.current = createOrbitAnimation(ringRef.current);
          }
        },
        () => {
          // On Reverse (Reset)
          setIsIntroComplete(false);
          isIntroCompleteRef.current = false;
          canReverseRef.current = false;
          isAutoScrolling.current = false; // Reset auto-scroll state
          orbitTweenRef.current?.kill();
          orbitTweenRef.current = null;

          // Clear canvases to prevent artifacts
          if (canvasLightRef.current) {
            const ctx = canvasLightRef.current.getContext("2d");
            ctx?.clearRect(
              0,
              0,
              canvasLightRef.current.width,
              canvasLightRef.current.height,
            );
          }
          if (canvasSmokeRef.current) {
            const ctx = canvasSmokeRef.current.getContext("2d");
            ctx?.clearRect(
              0,
              0,
              canvasSmokeRef.current.width,
              canvasSmokeRef.current.height,
            );
          }

          // Jump back to Zodiac and run zodiac reverse (enter) motion
          const zodiac = document.getElementById("zodiac");
          if (zodiac) {
            window.dispatchEvent(new CustomEvent("return-from-gallery"));
            // Zodiac handles overflow + ScrollTrigger.refresh in its animation onComplete
            // Do NOT set overflow auto here - zodiac needs it hidden during enter animation
            setTimeout(() => ScrollTrigger.refresh(), 100);
          } else {
            document.body.style.overflow = "auto";
          }
        },
      );

      // Force refresh to ensure start positions are correct after layout settles
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);
    }

    // Manual Reverse Trigger Logic - scroll up in gallery → reverse motion → jump to zodiac
    const attemptReverse = (e?: { preventDefault?: () => void }) => {
      if (!isSceneStableRef.current) return false;
      if (isAutoScrolling.current) return false;

      // Ensure we are fully scrolled to top before allowing reverse
      // This prevents accidental triggers if user is just scrolling normally in a long gallery
      // BUT this gallery is fixed height.

      // Additional Guard: Check if timeline is fully complete
      if (
        isIntroCompleteRef.current &&
        canReverseRef.current &&
        activeCardIndexRef.current === null &&
        timelineRef.current &&
        timelineRef.current.progress() > 0.95 // Ensure almost done
      ) {
        isAutoScrolling.current = true; // Lock interactions immediately

        // Disable scroll to prevent native jump
        if (e && e.preventDefault) e.preventDefault();
        document.body.style.overflow = "hidden";

        timelineRef.current.reverse().then(() => {
          // Only after reverse is complete, we jump.
          // The onReverseComplete callback in buildGalleryTimeline handles the jump.
          // But we ensure overflow stays hidden here.
        });
        return true;
      }
      return false;
    };

    // Only handle when gallery is in viewport
    const isGalleryInView = () => {
      const container = containerRef.current;
      if (!container) return false;
      const rect = container.getBoundingClientRect();
      return (
        rect.top < window.innerHeight * 0.5 &&
        rect.bottom > window.innerHeight * 0.3
      );
    };

    // Exit Animation to Story
    const handleExitToStory = () => {
      if (isAutoScrolling.current) return;
      isAutoScrolling.current = true;
      document.body.style.overflow = "hidden"; // Lock scroll

      // Pause Orbit
      orbitTweenRef.current?.pause();

      const tl = gsap.timeline({
        onComplete: () => {
          // Jump to Story
          const storySection = document.getElementById("story");
          if (storySection) {
            // Notify Story Scene to wake up and show itself immediately
            window.dispatchEvent(new CustomEvent("enter-story"));

            // Use exact calculation for scroll to ensure perfect alignment
            const rect = storySection.getBoundingClientRect();
            const scrollTop =
              window.pageYOffset || document.documentElement.scrollTop;
            // Add +2px to ensure we are "inside" the Story section trigger area
            // This ensures that any upward scroll immediately triggers onLeaveBack
            const targetTop = rect.top + scrollTop + 2;
            window.scrollTo({ top: targetTop, behavior: "auto" });

            // Unlock scroll
            setTimeout(() => {
              document.body.style.overflow = "auto";
              isAutoScrolling.current = false;

              // Hide Gallery elements to prevent obstruction
              if (containerRef.current) {
                gsap.set(containerRef.current, {
                  opacity: 0,
                  pointerEvents: "none",
                });
              }

              // Force ScrollTrigger refresh to ensure Story scene is caught
              ScrollTrigger.refresh();
            }, 500);
          }
        },
      });
      exitTimelineRef.current = tl;

      // 1. Spin Fast & Merge Cards
      if (ringRef.current) {
        tl.to(
          ringRef.current,
          {
            rotationY: "+=720", // Fast spin
            duration: 1.5,
            ease: "power4.in",
          },
          "start",
        );
      }

      // Animate all cards to center and fade out
      cardsRef.current.forEach((card) => {
        if (card) {
          tl.to(
            card,
            {
              x: 0,
              z: 0,
              rotationY: 0,
              scale: 0.5,
              opacity: 0,
              duration: 1.2,
              ease: "power2.in",
            },
            "start",
          );
        }
      });

      // 2. Reveal Transition Image (Morph)
      if (transitionImageRef.current) {
        // Calculate necessary scale to fill the screen
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // Base size of transition image is 300x450
        const baseW = 300;
        const baseH = 450;

        // Scale needed to cover width and height
        const scaleW = viewportWidth / baseW;
        const scaleH = viewportHeight / baseH;
        // Use max to ensure cover + 20% buffer to be safe
        const targetScale = Math.max(scaleW, scaleH) * 1.2;

        // Reset state
        tl.set(
          transitionImageRef.current,
          {
            display: "block",
            opacity: 0,
            scale: 0.5,
            rotation: 0,
          },
          "start+=1.0",
        );

        // Continuous Expansion (Fade In + Scale Up)
        tl.to(
          transitionImageRef.current,
          {
            opacity: 1,
            scale: targetScale,
            duration: 1.5, // Smooth, continuous zoom
            ease: "power2.inOut",
          },
          "start+=1.0",
        );
      }
    };

    // Wheel Handler - scroll up triggers gallery reverse → on complete jump to zodiac + zodiac reverse
    const handleWheel = (e: WheelEvent) => {
      if (!isGalleryInView()) return;
      if (!isIntroCompleteRef.current) return;

      // If card is open, let user interact with it
      if (activeCardIndexRef.current !== null) return;

      // LOCK PAGE SCROLL completely when in gallery view
      e.preventDefault();
      e.stopPropagation();

      // Prevent interactions if auto-scrolling (animation in progress)
      if (isAutoScrolling.current) return;

      // SCROLL UP -> Reverse to Zodiac
      if (e.deltaY < -1) {
        attemptReverse(e);
      }
      // SCROLL DOWN -> Exit to Story
      else if (e.deltaY > 1) {
        handleExitToStory();
      }
    };

    // Touch Handler
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isTouchingRef.current = true;
    };

    const handleTouchEnd = () => {
      isTouchingRef.current = false;
      touchStartY.current = null;
      touchStartX.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isGalleryInView()) return;
      if (!isIntroCompleteRef.current) return;

      // If card is open, allow interaction
      if (activeCardIndexRef.current !== null) return;

      // Prevent interactions if auto-scrolling
      if (isAutoScrolling.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (
        !isTouchingRef.current ||
        touchStartY.current === null ||
        touchStartX.current === null
      )
        return;

      // NOTE: We removed "if (isDraggingRef.current) return;" because on mobile,
      // a vertical swipe often starts with a slight touch that triggers pointerDown (dragging=true).
      // If we block it, vertical navigation never happens.

      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const deltaY = touchY - touchStartY.current;
      const deltaX = touchX - touchStartX.current;

      // Detect vertical swipe vs horizontal drag
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // This is a horizontal drag (Orbit Ring)
        // Let handlePointerMove handle it
        return;
      }

      // If we are here, it's a Vertical Swipe (Navigation)
      // We must cancel the 'dragging' state so the ring doesn't spin wildly
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }

      // Lock vertical scroll
      e.preventDefault();
      e.stopPropagation();

      // Scroll Up gesture (swipe down) -> deltaY > 50
      if (deltaY > 50) {
        attemptReverse();
      }
      // Scroll Down gesture (swipe up) -> deltaY < -50
      else if (deltaY < -50 && activeCardIndexRef.current === null) {
        // Trigger Exit to Story
        handleExitToStory();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      if (cleanupLight && typeof cleanupLight === "function") cleanupLight();
      if (cleanupSmoke && typeof cleanupSmoke === "function") cleanupSmoke();
      timelineRef.current?.kill();
      orbitTweenRef.current?.kill();
    };
  }, [gallery]);

  // Handle Card Click
  const handleCardClick = (index: number) => {
    if (activeCardIndex !== null) return; // Already one open

    const card = cardsRef.current[index];
    if (!card || !ringRef.current || !orbitTweenRef.current) return;

    // 1. Pause Orbit
    orbitTweenRef.current.pause();

    // 2. Measure Card for Overlay
    const rect = card.getBoundingClientRect();
    setActiveOverlay({ rect, item: gallery[index], index });
    setActiveCardIndex(index);
    window.history.pushState({ galleryView: "card" }, "");

    // 3. Hide original card
    gsap.set(card, { opacity: 0 });
  };

  // Animate Overlay when it appears
  useEffect(() => {
    if (!activeOverlay || !overlayCardRef.current) return;

    const card = overlayCardRef.current;
    const { rect } = activeOverlay;

    // Initial State (match original card position)
    gsap.set(card, {
      position: "fixed",
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 1000,
      rotationY: 0,
      scale: 1,
      x: 0,
      y: 0,
    });

    // Target State (Center of Screen)
    const isMobile = window.innerWidth < 768;
    // Max width logic
    const targetWidth = isMobile ? window.innerWidth * 0.95 : 600;
    // Maintain aspect ratio or fill height? Let's just set width and auto height, but cap height.
    // Actually, to animate smoothly, we should probably set fixed dimensions.
    // Original is 200x300 (aspect 0.66).
    const targetHeight = targetWidth * 1.5;

    // Ensure it fits vertically
    const maxHeight = window.innerHeight * 0.8;
    let finalWidth = targetWidth;
    let finalHeight = targetHeight;

    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = finalHeight / 1.5;
    }

    gsap.to(card, {
      top: "50%",
      left: "50%",
      x: "-50%",
      y: "-50%",
      width: finalWidth,
      height: finalHeight,
      rotationY: 180, // Flip to back
      duration: 0.8,
      ease: "power3.inOut",
    });
  }, [activeOverlay]);

  // Close Card Logic (Animation Only)
  const performCardClose = (index: number) => {
    const originalCard = cardsRef.current[index];
    const overlayCard = overlayCardRef.current;

    if (!originalCard || !overlayCard) {
      // Fallback if refs missing
      setActiveCardIndex(null);
      setActiveOverlay(null);
      if (originalCard) gsap.set(originalCard, { opacity: 1 });
      return;
    }

    // 1. Get original card position again (it shouldn't have moved much)
    const rect = originalCard.getBoundingClientRect();

    // 2. Animate Overlay back to original position
    gsap.to(overlayCard, {
      top: rect.top,
      left: rect.left,
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
      rotationY: 0, // Flip back to front
      duration: 0.8,
      ease: "power3.inOut",
      onComplete: () => {
        // 3. Cleanup
        setActiveCardIndex(null);
        setActiveOverlay(null);
        gsap.set(originalCard, { opacity: 1 });

        // 4. Resume Orbit
        orbitTweenRef.current?.kill();
        if (ringRef.current) {
          orbitTweenRef.current = createOrbitAnimation(ringRef.current);
        }
      },
    });
  };

  // Handle Hardware Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (fullscreenImage) {
        setFullscreenImage(null);
      } else if (activeCardIndex !== null) {
        performCardClose(activeCardIndex);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [fullscreenImage, activeCardIndex, radius, gallery.length]);

  // Handle Manual Close (Clicking X or Background)
  const handleManualClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // If active, go back in history (which triggers popstate -> close)
    if (activeCardIndex !== null) {
      window.history.back();
    }
  };

  // Render
  if (!gallery || gallery.length === 0) return null;

  return (
    <div
      id="gallery-scene"
      className={styles.sceneContainer}
      ref={containerRef}
      onClick={() => handleManualClose()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Background */}
      <div className={styles.backgroundLayer}>
        <img
          src={galleryBgSrc.src}
          alt="Gallery Background"
          className={styles.bgImage}
          ref={bgRef}
        />
      </div>

      {/* Canvas Layers */}
      <canvas className={styles.canvasLayer} ref={canvasLightRef} />
      <canvas className={styles.canvasLayer} ref={canvasSmokeRef} />

      {/* Altar Platform */}
      <div className={styles.altarContainer} ref={altarRef}>
        <div className={styles.spotlightGlow} ref={spotlightRef} />
        <div className={styles.stoneAltar} />
      </div>

      {/* 3D Ring */}
      <div className={styles.orbitRing} ref={ringRef}>
        {gallery.map((item, i) => (
          <div
            key={i}
            className={styles.cardContainer}
            ref={(el) => {
              cardsRef.current[i] = el;
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isIntroComplete) return; // Disable click during intro
              if (activeCardIndex === null) {
                handleCardClick(i);
              } else if (activeCardIndex === i) {
                // Tapping active card again? Maybe do nothing or just scroll
              } else {
                // Tapping another card while one is open? Ignore or close first?
                // Let's ignore to prevent glitches
              }
            }}
          >
            <div className={styles.cardInner}>
              {/* Front */}
              <div className={`${styles.cardFace} ${styles.cardFront}`}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className={styles.galleryImage}
                  />
                ) : (
                  <div className={styles.galleryPlaceholder}>No Image</div>
                )}
              </div>

              {/* Back */}
              <div className={`${styles.cardFace} ${styles.cardBack}`}>
                {item.image && (
                  <div
                    className={styles.cardBackImageContainer}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenImage(item.image);
                      window.history.pushState(
                        { galleryView: "fullscreen" },
                        "",
                      );
                    }}
                  >
                    <img
                      src={item.image}
                      className={styles.cardBackImage}
                      alt={item.title}
                    />
                  </div>
                )}
                <div className={styles.cardBackContent}>
                  <div className={styles.cardTitle}>{item.title}</div>
                  <div className={styles.cardDate}>{item.date}</div>
                  <div className={styles.cardDesc}>{item.description}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Close Hint */}
      <div
        className={`${styles.closeHint} ${activeCardIndex !== null ? styles.visible : ""}`}
      >
        Tap anywhere to close
      </div>

      {/* Transition Image for Exit */}
      <div
        ref={transitionImageRef}
        className={styles.transitionImage}
        style={{
          display: "none",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "300px", // Base size
          height: "450px",
          zIndex: 2000,
          opacity: 0,
        }}
      >
        <img
          src="/themes/aether/story/how_we_met/001.jpg"
          alt="Transition"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "10px",
          }}
        />
      </div>

      {/* Detached Overlay Card */}
      {activeOverlay && (
        <div
          ref={overlayCardRef}
          className={styles.activeCardOverlay}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.cardInner}>
            {/* Front */}
            <div className={`${styles.cardFace} ${styles.cardFront}`}>
              {activeOverlay.item.image ? (
                <img
                  src={activeOverlay.item.image}
                  alt={activeOverlay.item.title}
                  className={styles.galleryImage}
                />
              ) : (
                <div className={styles.galleryPlaceholder}>No Image</div>
              )}
            </div>

            {/* Back */}
            <div className={`${styles.cardFace} ${styles.cardBack}`}>
              {activeOverlay.item.image && (
                <div
                  className={styles.cardBackImageContainer}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenImage(activeOverlay.item.image);
                    window.history.pushState({ galleryView: "fullscreen" }, "");
                  }}
                >
                  <img
                    src={activeOverlay.item.image}
                    className={styles.cardBackImage}
                    alt={activeOverlay.item.title}
                  />
                </div>
              )}
              <div className={styles.cardBackContent}>
                <div className={styles.cardTitle}>
                  {activeOverlay.item.title}
                </div>
                <div className={styles.cardDate}>{activeOverlay.item.date}</div>
                <div className={styles.cardDesc}>
                  {activeOverlay.item.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Overlay */}
      {fullscreenImage && (
        <div
          className={fullscreenStyles.fullscreenOverlay}
          onClick={(e) => {
            e.stopPropagation();
            window.history.back();
          }}
        >
          <img
            src={fullscreenImage}
            className={fullscreenStyles.fullscreenImage}
            alt="Full view"
          />
        </div>
      )}
    </div>
  );
}
