"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import styles from "./styles.module.css";
import { CoupleHoroscope, ZodiacSceneProps } from "./types";
import { ConstellationCanvas } from "./canvasConstellation";
import { LightParticleSystem } from "./canvasLight";
import { buildZodiacTimeline, createInfiniteSpin } from "./motion";
import galaxyBgSrc from "./assets/galaxy-bg.jpg";
import zodiacIconsSrc from "./assets/zodiac-icons.svg";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export default function ZodiacScene({
  male_birthdate,
  female_birthdate,
  male_name,
  female_name,
}: ZodiacSceneProps) {
  const [data, setData] = useState<CoupleHoroscope | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const lightCoreRef = useRef<HTMLDivElement>(null);
  const zodiacContainerRef = useRef<HTMLDivElement>(null);
  const zodiacRingRef = useRef<HTMLDivElement>(null);
  const unifiedCardRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const compatibilityRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const constellationRef = useRef<ConstellationCanvas | null>(null);
  const lightSystemRef = useRef<LightParticleSystem | null>(null);
  const isAutoScrolling = useRef(false);
  const isReturningFromGallery = useRef(false);
  const suppressReverseRef = useRef(false);

  // Helper to format date YYYY-MM-DD to DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const [year, month, day] = dateStr.split("-");
      if (year && month && day) {
        return `${day}-${month}-${year}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/zodiac", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ male_birthdate, female_birthdate }),
        });

        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (male_birthdate && female_birthdate) {
      fetchData();
    }
  }, [male_birthdate, female_birthdate]);

  // 2. Initialize Canvas & Animation
  useEffect(() => {
    if (
      loading ||
      !data ||
      !canvasRef.current ||
      !lightCanvasRef.current ||
      !containerRef.current
    )
      return;

    // Init Canvases
    const constellation = new ConstellationCanvas(canvasRef.current);
    const lightSystem = new LightParticleSystem(lightCanvasRef.current);

    constellationRef.current = constellation;
    lightSystemRef.current = lightSystem;

    constellation.setConstellation(data.male.sign);
    // Light system starts in timeline

    // Build GSAP Timeline
    const ctx = gsap.context(() => {
      if (
        !lightCoreRef.current ||
        !zodiacContainerRef.current ||
        !zodiacRingRef.current ||
        !unifiedCardRef.current ||
        !cardContentRef.current ||
        !compatibilityRef.current
      )
        return;

      timelineRef.current = buildZodiacTimeline(
        {
          sceneContainer: containerRef.current!,
          lightCore: lightCoreRef.current,
          zodiacContainer: zodiacContainerRef.current,
          zodiacRing: zodiacRingRef.current,
          unifiedCard: unifiedCardRef.current,
          cardContent: cardContentRef.current,
          compatibilitySection: compatibilityRef.current,
          canvas: canvasRef.current!,
          lightCanvas: lightCanvasRef.current!,
          background: bgRef.current!,
        },
        constellationRef.current,
        lightSystemRef.current,
        data.male.sign,
        data.female.sign,
      );

      // ScrollTrigger with PIN & SCRUB
      const st = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=4000", // Increased to allow content scrolling
        pin: true,
        scrub: 1,
        animation: timelineRef.current!,
        refreshPriority: 5,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          console.log("ScrollTrigger progress:", self.progress);
        },
        onLeave: () => {
          // Start infinite spin when scroll finishes
          if (zodiacRingRef.current) {
            spinTweenRef.current = createInfiniteSpin(zodiacRingRef.current);
          }
        },
        onEnterBack: () => {
          // Kill spin when scrolling back into the scene
          if (spinTweenRef.current) {
            spinTweenRef.current.kill();
            spinTweenRef.current = null;
          }
        },
      });
      scrollTriggerRef.current = st;

      // Remove temporary minHeight used to prevent clamping
      document.body.style.minHeight = "";
    }, containerRef);

    return () => {
      ctx.revert();
      constellation.destroy();
      lightSystem.destroy();
      document.body.style.overflow = "auto";
      // ScrollTrigger is reverted by ctx.revert() automatically if created inside context
    };
  }, [loading, data]);

  // Handle Return from Gallery with Animation
  useEffect(() => {
    const handleReturn = () => {
      if (suppressReverseRef.current) return;
      if (!timelineRef.current || !scrollTriggerRef.current) return;
      isReturningFromGallery.current = true;

      // 1. Force Scroll Position to END (Timeline Progress 1)
      // This ensures that the ScrollTrigger controls the elements and they are at their "end" state.
      const st = scrollTriggerRef.current;
      st.scroll(st.end);
      timelineRef.current.progress(1);

      // Lock scroll during transition
      document.body.style.overflow = "hidden";

      // 2. Play "Reverse Exit" Animation
      // We animate FROM the "Exit" state (what the user saw before returning)
      // TO the current state (which is the Timeline End state).
      // Since we just set progress(1), the elements are currently at the "End" state.
      // We use .fromTo() to animate them.

      const tl = gsap.timeline({
        onComplete: () => {
          isReturningFromGallery.current = false;
          isAutoScrolling.current = false;
          document.body.style.overflow = "auto";
          // Ensure ScrollTrigger is synced
          st.refresh();
        },
      });

      // Background: From blurred/scaled to Normal
      if (bgRef.current) {
        tl.fromTo(
          bgRef.current,
          { scale: 2, filter: "blur(20px)", opacity: 1 },
          {
            scale: 1,
            filter: "blur(0px)",
            opacity: 1,
            duration: 1.2,
            ease: "power2.out",
          },
          0,
        );
      }

      // Ring: From large/spun to Normal (90deg)
      if (zodiacRingRef.current) {
        // Timeline ends at rotation: 90.
        // Exit added 720 -> 810.
        tl.fromTo(
          zodiacRingRef.current,
          { scale: 8, rotation: 810 },
          {
            scale: 1,
            rotation: 90,
            duration: 1.2,
            ease: "power4.out",
          },
          0,
        );
      }

      // Card: From hidden to Visible
      if (unifiedCardRef.current) {
        tl.fromTo(
          unifiedCardRef.current,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.0,
            ease: "back.out(1.2)",
          },
          0.2,
        );
      }

      // Compatibility: From hidden
      if (compatibilityRef.current) {
        tl.fromTo(
          compatibilityRef.current,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
          },
          0.2,
        );
      }
    };

    window.addEventListener("return-from-gallery", handleReturn);

    const handleReset = () => {
      if (!timelineRef.current) return;
      timelineRef.current.progress(1);
      isAutoScrolling.current = false;
    };
    window.addEventListener("reset-zodiac", handleReset);

    const handleIntroReset = () => {
      isAutoScrolling.current = false;
      isReturningFromGallery.current = false;
      suppressReverseRef.current = true;
      gsap.killTweensOf(window);
      setTimeout(() => {
        suppressReverseRef.current = false;
      }, 4000);
    };
    window.addEventListener("reset-intro", handleIntroReset);

    return () => {
      window.removeEventListener("return-from-gallery", handleReturn);
      window.removeEventListener("reset-zodiac", handleReset);
      window.removeEventListener("reset-intro", handleIntroReset);
    };
  }, []);

  // Suppress Zodiac manual handlers when entering Story via link
  useEffect(() => {
    const handleEnterStory = () => {
      suppressReverseRef.current = true;
      isAutoScrolling.current = false;
      isReturningFromGallery.current = false;
      gsap.killTweensOf(window);
      setTimeout(() => {
        suppressReverseRef.current = false;
      }, 1500);
    };

    window.addEventListener("enter-story", handleEnterStory);
    return () => window.removeEventListener("enter-story", handleEnterStory);
  }, []);

  // Handle Scroll Interactions (Unified Card & Window) - Scroll from anywhere when zodiac in view
  useEffect(() => {
    if (loading || !data || !cardContentRef.current || !containerRef.current)
      return;

    const cardContent = cardContentRef.current;
    const container = containerRef.current;
    let touchStartY = 0;

    // Only handle when zodiac section is in viewport (prevents conflicts with gallery)
    const isZodiacInView = () => {
      const rect = container.getBoundingClientRect();
      return (
        rect.top < window.innerHeight * 0.5 &&
        rect.bottom > window.innerHeight * 0.3
      );
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isZodiacInView()) return;
      if (isAutoScrolling.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!timelineRef.current || timelineRef.current.time() < 3.5) return;
      if (suppressReverseRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = cardContent;
      const isScrollDown = e.deltaY > 0;
      const isScrollUp = e.deltaY < 0;

      // 1. SCROLL DOWN
      if (isScrollDown) {
        // If content can scroll down, prioritize content scroll
        if (scrollTop + clientHeight < scrollHeight - 1) {
          e.preventDefault(); // Stop window scroll (keep Pinned)
          e.stopPropagation();
          cardContent.scrollTop += e.deltaY;
        } else {
          // If content is at bottom, TRIGGER EXIT TO GALLERY
          e.preventDefault();
          e.stopPropagation();

          if (!isAutoScrolling.current) {
            isAutoScrolling.current = true;
            // Lock body scroll to prevent native scroll from bypassing the animation
            document.body.style.overflow = "hidden";

            // EXIT ANIMATION SEQUENCE
            const tl = gsap.timeline({
              onComplete: () => {
                // HARD JUMP / INSTANT SCROLL
                const gallerySection = document.getElementById("gallery");
                if (gallerySection) {
                  gallerySection.scrollIntoView({ behavior: "auto" });
                  // Signal Gallery to start its animation sequence explicitly
                  window.dispatchEvent(new CustomEvent("enter-gallery"));
                }

                // Unlock scroll after jump
                // Small delay to ensure the browser has processed the jump
                setTimeout(() => {
                  document.body.style.overflow = "auto";
                  isAutoScrolling.current = false;
                }, 50);
              },
            });

            // 1. Card Disappears
            tl.to(
              unifiedCardRef.current,
              {
                opacity: 0,
                scale: 0.8,
                duration: 0.8,
                ease: "back.in(1.7)",
              },
              0,
            );

            // 2. Zodiac Icon Spins Fast & Zooms
            tl.to(
              zodiacRingRef.current,
              {
                rotation: "+=720", // Spin faster (2 full rotations)
                scale: 8, // Zoom larger
                duration: 1.5,
                ease: "power4.in",
              },
              0.1, // Start slightly earlier
            );

            // 3. Background Zooms & Blurs
            tl.to(
              bgRef.current,
              {
                scale: 2,
                filter: "blur(20px)", // Stronger blur
                duration: 1.5,
                ease: "power2.in",
              },
              0.1,
            );
          }
        }
      }

      // 2. SCROLL UP
      if (isScrollUp) {
        // If content can scroll up, prioritize content scroll
        if (scrollTop > 5) {
          e.preventDefault(); // Stop window scroll (keep Pinned)
          e.stopPropagation();
          cardContent.scrollTop += e.deltaY;
        } else {
          // ELSE: Content is at top. TRIGGER AUTO REVERSE TO INTRO
          e.preventDefault();
          e.stopPropagation();

          if (!isAutoScrolling.current && scrollTriggerRef.current) {
            isAutoScrolling.current = true;
            // document.body.style.overflow = "hidden"; // Don't hide overflow, it breaks scrollTo

            // 1. Scroll to Start of Zodiac (Reverses Animation)
            gsap.to(window, {
              scrollTo: scrollTriggerRef.current.start,
              duration: 2.0,
              ease: "power2.inOut",
              onComplete: () => {
                // 2. Once reversed, scroll to Intro
                const introSection = document.getElementById("intro");
                if (introSection) {
                  introSection.scrollIntoView({ behavior: "smooth" });
                }

                // Unlock scroll after jump
                setTimeout(() => {
                  document.body.style.overflow = "auto";
                  isAutoScrolling.current = false;
                }, 1000);
              },
            });
          }
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isZodiacInView()) return;
      if (!timelineRef.current || timelineRef.current.time() < 3.5) return;
      if (suppressReverseRef.current) return;
      if (isAutoScrolling.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY; // Positive = scroll down, Negative = scroll up
      const { scrollTop, scrollHeight, clientHeight } = cardContent;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      const isAtTop = scrollTop <= 5;

      // Touch: whole viewport = scroll area for card (scroll from outside card works)
      if (deltaY > 0) {
        if (!isAtBottom) {
          e.preventDefault();
          e.stopPropagation();
          // Scroll card content (works when touch is inside OR outside card)
          cardContent.scrollTop += deltaY;
          touchStartY = touchY;
        } else {
          // At bottom -> Trigger Exit
          e.preventDefault();
          e.stopPropagation();

          if (!isAutoScrolling.current) {
            isAutoScrolling.current = true;

            // Lock body scroll to prevent native scroll from bypassing the animation
            document.body.style.overflow = "hidden";

            // EXIT ANIMATION SEQUENCE (Copy of above)
            const tl = gsap.timeline({
              onComplete: () => {
                const gallerySection = document.getElementById("gallery");
                if (gallerySection) {
                  gallerySection.scrollIntoView({ behavior: "auto" });
                  // Signal Gallery to start its animation sequence explicitly
                  window.dispatchEvent(new CustomEvent("enter-gallery"));
                }

                // Unlock scroll after jump
                setTimeout(() => {
                  document.body.style.overflow = "auto";
                  isAutoScrolling.current = false;
                }, 50);
              },
            });

            tl.to(
              unifiedCardRef.current,
              {
                opacity: 0,
                scale: 0.8,
                duration: 0.8,
                ease: "back.in(1.7)",
              },
              0,
            );
            tl.to(
              zodiacRingRef.current,
              {
                rotation: "+=720", // Spin faster
                scale: 8, // Zoom larger
                duration: 1.5,
                ease: "power4.in",
              },
              0.1,
            );
            tl.to(
              bgRef.current,
              {
                scale: 2,
                filter: "blur(20px)",
                duration: 1.5,
                ease: "power2.in",
              },
              0.1,
            );
          }
        }
      } else if (deltaY < 0) {
        if (!isAtTop) {
          e.preventDefault();
          e.stopPropagation();
          cardContent.scrollTop += deltaY;
          touchStartY = touchY;
        } else {
          // Auto Reverse Logic (same as wheel)
          e.preventDefault();
          e.stopPropagation();

          if (!isAutoScrolling.current && scrollTriggerRef.current) {
            isAutoScrolling.current = true;
            // document.body.style.overflow = "hidden"; // Don't hide overflow, it breaks scrollTo

            gsap.to(window, {
              scrollTo: scrollTriggerRef.current.start,
              duration: 2.0,
              ease: "power2.inOut",
              onComplete: () => {
                const introSection = document.getElementById("intro");
                if (introSection) {
                  introSection.scrollIntoView({ behavior: "smooth" });
                }
                setTimeout(() => {
                  document.body.style.overflow = "auto";
                  isAutoScrolling.current = false;
                }, 1000);
              },
            });
          }
        }
      }
    };

    // Attach to window AND container for reliable capture (PC + mobile, inside/outside card)
    window.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("wheel", handleWheel, { passive: false });
    // We also need to capture inside card to stop propagation explicitly
    cardContent.addEventListener("wheel", handleWheel, { passive: false });

    // Touch listeners - capture on container so scroll works from anywhere (inside/outside card)
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchmove", handleTouchMove, true);
    };
  }, [loading, data]);

  if (loading) return <div className={styles.loading}>MEMBACA BINTANG...</div>;
  if (!data) return null;

  return (
    <div ref={containerRef} className={styles.sceneContainer}>
      {/* Background Layer */}
      <div className={styles.backgroundLayer}>
        <img
          ref={bgRef}
          src={galaxyBgSrc.src}
          alt="Galaxy Background"
          className={styles.galaxyBg}
        />
      </div>

      {/* Canvas Layers */}
      {/* <canvas ref={starCanvasRef} className={styles.starCanvasLayer} /> */}
      <canvas ref={canvasRef} className={styles.canvasLayer} />
      <canvas ref={lightCanvasRef} className={styles.lightCanvasLayer} />

      {/* Light Core */}
      <div ref={lightCoreRef} className={styles.lightCore} />

      {/* Zodiac Ring (Spinning Icons) */}
      <div ref={zodiacRingRef} className={styles.zodiacRing}>
        <img
          src={zodiacIconsSrc.src}
          alt="Zodiac Wheel"
          className={styles.zodiacWheelImage}
        />
      </div>

      {/* Phase 4: Zodiac Cards (Unified) */}
      <div ref={zodiacContainerRef} className={styles.zodiacContainer}>
        <div ref={unifiedCardRef} className={styles.unifiedCard}>
          <div ref={cardContentRef} className={styles.cardContent}>
            {/* Phase 6: Compatibility (Now at Top) */}
            <div ref={compatibilityRef} className={styles.compatibilitySection}>
              <div className={styles.compatibilityLabel}>
                Kecocokan Hubungan ({data.date})
              </div>
              <div className={styles.progressContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${data.compatibility_percent}%` }}
                />
              </div>
              <div className={styles.percentageText}>
                {data.compatibility_percent}%
              </div>
              <div
                className={styles.summaryText}
                style={{ whiteSpace: "pre-line", textAlign: "justify" }}
              >
                {data.summary}
              </div>
            </div>

            <div className={styles.coupleRow}>
              <div className={styles.personInfo}>
                {/* Male Side */}
                <div className={styles.personName}>{male_name}</div>
                <div className={styles.personDate}>
                  {formatDate(male_birthdate)}
                </div>
                <h3 className={styles.signName}>{data.male.sign}</h3>
                <p className={styles.horoscopeText}>{data.male.horoscope}</p>
              </div>

              {/* Female Side */}
              <div className={styles.personInfo}>
                <div className={styles.personName}>{female_name}</div>
                <div className={styles.personDate}>
                  {formatDate(female_birthdate)}
                </div>
                <h3 className={styles.signName}>{data.female.sign}</h3>
                <p className={styles.horoscopeText}>{data.female.horoscope}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
