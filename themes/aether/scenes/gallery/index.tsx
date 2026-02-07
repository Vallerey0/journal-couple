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

  // Helper for responsive card sizing
  const getResponsiveSettings = () => {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const perspective = isMobile ? 800 : 1200;
    const cardBaseWidth = 200; // From CSS

    // Target width: Almost full screen on mobile, larger on desktop
    const targetWidth = isMobile ? width * 0.95 : 600;

    // We'll use a moderate Z to bring it forward, but rely on scale for size
    const targetZ = isMobile ? 100 : 200;

    // Calculate Perspective Scale Factor at targetZ
    // scaleFactor = p / (p - z)
    const perspectiveScale = perspective / (perspective - targetZ);

    // We want: cardBaseWidth * perspectiveScale * finalScale = targetWidth
    // finalScale = targetWidth / (cardBaseWidth * perspectiveScale)
    const scale = targetWidth / (cardBaseWidth * perspectiveScale);

    return { z: targetZ, scale };
  };

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
          // On Intro Complete
          setIsIntroComplete(true);
          isIntroCompleteRef.current = true;

          // Add grace period before allowing reverse (prevents accidental bounce-back)
          setTimeout(() => {
            canReverseRef.current = true;
          }, 500); // Reduced from 1500ms to 500ms for better responsiveness

          // Lock scroll to prevent scrolling away, forcing the reverse gesture
          document.body.style.overflow = "hidden";
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

      if (
        isIntroCompleteRef.current &&
        canReverseRef.current &&
        activeCardIndexRef.current === null &&
        timelineRef.current &&
        timelineRef.current.progress() > 0.9
      ) {
        e?.preventDefault?.();
        document.body.style.overflow = "hidden";
        timelineRef.current.reverse();
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

    // Wheel Handler - scroll up triggers gallery reverse → on complete jump to zodiac + zodiac reverse
    const handleWheel = (e: WheelEvent) => {
      if (!isGalleryInView()) return;
      if (!isIntroCompleteRef.current) return;

      if (e.deltaY < -5) {
        if (attemptReverse(e)) {
          e.preventDefault();
          e.stopPropagation();
        }
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
      if (
        !isTouchingRef.current ||
        touchStartY.current === null ||
        touchStartX.current === null
      )
        return;

      if (isDraggingRef.current) return;

      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const deltaY = touchY - touchStartY.current;
      const deltaX = touchX - touchStartX.current;

      if (Math.abs(deltaX) > Math.abs(deltaY)) return;

      // Scroll Up gesture (swipe down) -> deltaY > 0
      if (deltaY > 100) {
        if (attemptReverse()) {
          e.preventDefault();
          e.stopPropagation();
        }
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
