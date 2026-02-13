"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import styles from "./styles.module.css";
import { buildTimeline } from "./motion";
import { StarBackground } from "./starBackground";
import paperSrc from "./assets/paper.svg";
import galaxyBgSrc from "./assets/galaxy-bg.jpg";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Font setup
const dancingScript = localFont({
  src: "./assets/DancingScript-Regular.woff2",
  display: "swap",
  variable: "--font-dancing",
});

interface IntroLetterProps {
  couple: {
    male_name: string;
    female_name: string;
    male_nickname?: string | null;
    female_nickname?: string | null;
    male_birth_date?: string | null;
    female_birth_date?: string | null;
    male_hobby?: string | null;
    female_hobby?: string | null;
    male_city?: string | null;
    female_city?: string | null;
    relationship_start_date: string;
    relationship_stage?: string | null;
    married_at?: string | null;
    anniversary_note?: string | null;
    notes?: string | null;
    show_age?: boolean | null;
    show_zodiac?: boolean | null;
    [key: string]: any;
  };
}

export default function IntroLetterScene({ couple }: IntroLetterProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const envelopeWrapperRef = useRef<HTMLDivElement>(null);
  const envelopeBackRef = useRef<HTMLDivElement>(null);
  const envelopeFrontRef = useRef<SVGSVGElement>(null);
  const envelopeFlapRef = useRef<SVGSVGElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const paperContentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const lightOrbRef = useRef<HTMLDivElement>(null);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const floatingTweenRef = useRef<gsap.core.Tween | null>(null);
  const breathingTweenRef = useRef<gsap.core.Tween | null>(null);
  const isFloatingRef = useRef(true);
  const autoScrollTriggered = useRef(false);

  // Handle Client-Side Mounting (Hydration Fix)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Scroll Lock
    document.body.style.overflow = "hidden";

    // Init Star Background
    let starBg: StarBackground | null = null;
    let animationFrameId: number;
    if (starCanvasRef.current) {
      starBg = new StarBackground(starCanvasRef.current);
    }

    // Canvas Resize Handler
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // GSAP Context for cleanup
    const ctx = gsap.context(() => {
      if (
        !containerRef.current ||
        !envelopeWrapperRef.current ||
        !envelopeBackRef.current ||
        !envelopeFrontRef.current ||
        !envelopeFlapRef.current ||
        !paperRef.current ||
        !paperContentRef.current ||
        !canvasRef.current
      )
        return;

      // --- 0. FLOATING ANIMATION (Idle State) ---
      // Random movement to simulate floating in space
      // We use a separate tween so we can kill it easily on interaction
      isFloatingRef.current = true;

      const startIdleAnimations = () => {
        if (
          !envelopeWrapperRef.current ||
          !envelopeBackRef.current ||
          !envelopeFrontRef.current ||
          !envelopeFlapRef.current
        )
          return;

        // Target only the envelope parts, EXCLUDING the paper
        // To keep them synchronized (move as one unit), we animate a proxy object
        // and apply the values to all parts in onUpdate.
        const envelopeParts = [
          envelopeBackRef.current,
          envelopeFrontRef.current,
          envelopeFlapRef.current,
        ];

        // Fix: Set common transform origin (Top Center) for all parts to prevent detachment
        // The flap pivots from the top, so other parts must match to rotate in sync.
        gsap.set(envelopeParts, { transformOrigin: "50% 0%" });

        const proxy = { x: 0, y: 0, rotation: 0, scale: 1 };

        // X/Y/Rotation Floating - More aggressive
        floatingTweenRef.current = gsap.to(proxy, {
          x: "random(-20, 20)",
          y: "random(-20, 20)",
          rotation: "random(-4, 4)",
          duration: 2.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
          onUpdate: () => {
            gsap.set(envelopeParts, {
              x: proxy.x,
              y: proxy.y,
              rotation: proxy.rotation,
            });
          },
        });

        // Scale Breathing - Faster
        breathingTweenRef.current = gsap.to(proxy, {
          scale: 1.05,
          duration: 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          onUpdate: () => {
            gsap.set(envelopeParts, {
              scale: proxy.scale,
            });
          },
        });
      };

      // --- STAR TRAIL EFFECT (OPTIMIZED) ---
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { alpha: true }); // Enable alpha for better performance if needed

      interface StarParticle {
        x: number;
        y: number;
        size: number;
        opacity: number;
        speedX: number;
        speedY: number;
        life: number;
      }

      const stars: StarParticle[] = [];
      const maxStars = 20; // Reduced from 50 to 20 for performance

      const createStar = (x: number, y: number): StarParticle => ({
        x,
        y,
        size: Math.random() * 2 + 1, // Slightly smaller stars
        opacity: 0.8, // Start slightly transparent
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        life: 1.0,
      });

      const drawStar = (ctx: CanvasRenderingContext2D, star: StarParticle) => {
        // Simplified drawing - reduced shadowBlur which is expensive
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = "#FCD34D";
        // ctx.shadowBlur = 2; // Reduced shadow blur or remove entirely
        // ctx.shadowColor = "#FCD34D";

        // Draw simple circle instead of complex path for better performance
        ctx.beginPath();
        ctx.arc(0, 0, star.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      const renderTrail = () => {
        if (!context || !isFloatingRef.current) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Spawn new stars at envelope position - Reduced spawn rate
        if (envelopeWrapperRef.current) {
          const rect = envelopeWrapperRef.current.getBoundingClientRect();
          // Center of envelope
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          // Randomly spawn - Lower probability
          if (Math.random() > 0.9) {
            stars.push(createStar(centerX, centerY));
          }
        }

        // Update and draw stars
        for (let i = stars.length - 1; i >= 0; i--) {
          const star = stars[i];
          star.x += star.speedX;
          star.y += star.speedY;
          star.opacity -= 0.02; // Fade out faster
          star.life -= 0.02;
          star.size *= 0.95; // Shrink faster

          if (star.opacity <= 0 || star.life <= 0) {
            stars.splice(i, 1);
          } else {
            drawStar(context, star);
          }
        }

        // Limit max stars
        if (stars.length > maxStars) {
          stars.splice(0, stars.length - maxStars);
        }

        if (isFloatingRef.current) {
          animationFrameId = requestAnimationFrame(renderTrail);
        } else {
          context.clearRect(0, 0, canvas.width, canvas.height); // Clear when done
        }
      };

      // Start loop
      renderTrail();

      timelineRef.current = buildTimeline(
        {
          sceneContainer: containerRef.current,
          envelopeWrapper: envelopeWrapperRef.current,
          envelopeBack: envelopeBackRef.current,
          envelopeFront: envelopeFrontRef.current,
          envelopeFlap: envelopeFlapRef.current,
          paperContainer: paperRef.current,
          paperContent: paperContentRef.current,
          canvas: canvasRef.current,
        },
        () => {
          // Trigger handwriting reveal animation for text content
          const textElements =
            paperContentRef.current?.querySelectorAll("h1, p");
          if (textElements) {
            // Set initial state for handwriting effect
            gsap.set(textElements, {
              clipPath: "inset(0 100% 0 0)",
              opacity: 1,
              y: 0,
            });

            gsap.to(textElements, {
              clipPath: "inset(0 0% 0 0)",
              duration: 1, // Faster writing
              stagger: 0.2, // Faster sequence
              ease: "power1.inOut",
              onComplete: () => {
                setIsCompleted(true);
                document.body.style.overflow = ""; // Unlock scroll only after writing
              },
            });
          } else {
            // Fallback if no text elements
            setIsCompleted(true);
            document.body.style.overflow = "";
          }
        },
        startIdleAnimations, // On Ready (Start floating)
      );

      // Start the timeline
      timelineRef.current.play();
    }, containerRef);

    return () => {
      isFloatingRef.current = false; // Stop loop
      if (animationFrameId) cancelAnimationFrame(animationFrameId); // Explicitly cancel
      window.removeEventListener("resize", updateCanvasSize);
      ctx.revert();
      if (starBg) starBg.destroy();
      document.body.style.overflow = "";
    };
  }, [isMounted]);

  // Handle Exit Animation (ScrollTrigger) - Only activate when letter is fully open
  useEffect(() => {
    if (
      !isCompleted ||
      !containerRef.current ||
      !envelopeWrapperRef.current ||
      !paperRef.current ||
      !lightOrbRef.current ||
      !starCanvasRef.current
    )
      return;

    const ctx = gsap.context(() => {
      // --- EXIT ANIMATION (Crumple -> Light Orb -> Fall) ---
      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=2000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 10, // Ensure this calculates before downstream pins
        },
      });

      // 1. Shrink Paper & Reveal Light
      exitTl
        .to(
          paperRef.current,
          {
            scale: 0,
            opacity: 0,
            duration: 1,
            ease: "power1.inOut",
          },
          0,
        )
        .to(
          lightOrbRef.current,
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          },
          0.5,
        )
        // 2. Warp Speed / Falling Effect (Blur stars vertically)
        .to(
          starCanvasRef.current,
          {
            scaleY: 20,
            opacity: 0.5,
            duration: 1,
            ease: "power1.in",
          },
          0,
        )
        // 3. Light Orb Falls Down
        .to(
          lightOrbRef.current,
          {
            y: window.innerHeight,
            duration: 1,
            ease: "power1.in",
          },
          0.5,
        );
    }, containerRef);

    return () => ctx.revert();
  }, [isCompleted]);

  // Handle Scroll Interactions (Paper & Window)
  useEffect(() => {
    if (!isMounted || !paperContentRef.current) return;

    const paperContent = paperContentRef.current;
    let touchStartY: number | null = null;
    let isAtTopOnStart = false;

    // --- 1. PAPER SCROLL HANDLER (Inside the letter) ---
    const handlePaperWheel = (e: WheelEvent) => {
      // Block interaction if auto-scroll is running or writing not completed
      if (autoScrollTriggered.current || !isCompleted) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!timelineRef.current || timelineRef.current.progress() < 0.99) return;

      // A. SCROLL UP: Reverse letter (Close)
      if (e.deltaY < 0 && paperContent.scrollTop <= 0) {
        document.body.style.overflow = "hidden"; // Re-lock scroll
        timelineRef.current.tweenTo("ready", {
          onComplete: () => {
            const textElements =
              paperContentRef.current?.querySelectorAll("h1, p");
            if (textElements) {
              gsap.set(textElements, {
                clipPath: "inset(0 100% 0 0)",
              });
            }
          },
        });
        setIsCompleted(false);
        return;
      }

      // B. SCROLL DOWN: Delegate to handleWindowWheel for unified logic
      // We don't handle forward auto-scroll here anymore to avoid duplication.
      // The event will propagate to window, where handleWindowWheel will catch it
      // and perform the checks (isPaperScroll, isNearBottom, etc.)
    };

    // --- 2. WINDOW SCROLL HANDLER (Transition Zone) ---
    const handleWindowWheel = (e: WheelEvent) => {
      // Block interaction if auto-scroll is running
      if (autoScrollTriggered.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const scrollY = window.scrollY;
      const transitionZoneEnd = 2500;

      // GUARD: If we are past the intro section (plus some buffer), ignore this listener
      // This prevents the intro's auto-scroll logic from hijacking scroll in subsequent scenes (like Story)
      if (scrollY > transitionZoneEnd + 500) return;

      // If scrolling UP (deltaY < 0) inside the transition zone (and letter is open)
      // We want to handle "Reverse Auto-Scroll" back to top of intro

      if (e.deltaY < 0 && !autoScrollTriggered.current) {
        // 1. If letter is open (isCompleted), try to scroll paper UP first
        if (isCompleted && paperContent.scrollTop > 0) {
          e.preventDefault();
          paperContent.scrollTop += e.deltaY;
          return;
        }

        // 2. Reverse Auto-Scroll (if not scrolling paper)
        if (scrollY < transitionZoneEnd && scrollY > 50) {
          e.preventDefault();
          autoScrollTriggered.current = true;
          gsap.to(window, {
            scrollTo: 0,
            duration: 2,
            ease: "power2.inOut",
            onComplete: () => {
              autoScrollTriggered.current = false;
            },
          });
          return;
        }
      }

      // FORWARD AUTO-SCROLL LOGIC (Unified for Window & Paper)
      // If scrolling DOWN (deltaY > 0)
      if (e.deltaY > 0 && !autoScrollTriggered.current) {
        // Check if we are interacting with paper or window
        // Logic: If user scrolls down on window, OR scrolls down on paper (and paper is at bottom)
        // Then trigger auto scroll to next scene

        const isPaperScroll =
          e.target === paperContent || paperContent.contains(e.target as Node);
        let shouldTrigger = false;

        if (isPaperScroll) {
          const maxScroll =
            paperContent.scrollHeight - paperContent.clientHeight;
          // Only trigger if we are strictly AT the bottom (tolerance for fractional pixels)
          const isAtBottom = paperContent.scrollTop >= maxScroll - 2;

          if (isAtBottom && e.deltaY > 0) {
            shouldTrigger = true;
          }
        } else {
          // Window scroll: if letter is completed/open, check paper scroll first
          if (isCompleted) {
            const maxScroll =
              paperContent.scrollHeight - paperContent.clientHeight;
            const isAtBottom = paperContent.scrollTop >= maxScroll - 2;

            if (!isAtBottom) {
              e.preventDefault();
              paperContent.scrollTop += e.deltaY;
              return;
            }

            // Only trigger next scene if paper is already at bottom
            shouldTrigger = true;
          }
        }

        if (shouldTrigger) {
          e.preventDefault();
          autoScrollTriggered.current = true;
          // Calculate distance to end of pinned section + viewport height
          const totalScrollDistance = 2000 + 2000 + window.innerHeight;

          gsap.to(window, {
            scrollTo: {
              y: `+=${totalScrollDistance}`,
              autoKill: false,
            },
            duration: 3, // Slightly faster than before (was 5)
            ease: "power2.inOut",
            onComplete: () => {
              autoScrollTriggered.current = false;
            },
          });
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      // Capture if we are at the top when the touch begins
      // This prevents closing the letter when the user is just scrolling up from the bottom
      if (paperContentRef.current) {
        isAtTopOnStart = paperContentRef.current.scrollTop <= 5; // Tolerance of 5px
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // GUARD: If we are past the intro section, ignore this listener
      if (window.scrollY > 3000) return;

      // Block interaction if auto-scroll is running or writing not completed
      if (autoScrollTriggered.current || !isCompleted) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!timelineRef.current || timelineRef.current.progress() < 0.99) return;

      // GUARD: Ensure touch start was registered in this active session
      // This prevents "stale" touches (started during writing animation) from triggering actions immediately after completion
      if (touchStartY === null) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY; // Positive = Scroll Down (Drag Up)

      // A. PAPER INTERACTIONS
      if (
        e.target === paperContent ||
        paperContent.contains(e.target as Node)
      ) {
        // 1. PULL DOWN: Reverse letter (Close)
        // Adjusted threshold to -70 to allow easier closing when "stuck" at top
        if (deltaY < -70 && paperContent.scrollTop <= 1) {
          document.body.style.overflow = "hidden";
          timelineRef.current.tweenTo("ready", {
            onComplete: () => {
              const textElements =
                paperContentRef.current?.querySelectorAll("h1, p");
              if (textElements) {
                gsap.set(textElements, {
                  clipPath: "inset(0 100% 0 0)",
                });
              }
            },
          });
          setIsCompleted(false);
          return;
        }

        // 2. PULL UP: Auto-scroll Forward
        const maxScroll = paperContent.scrollHeight - paperContent.clientHeight;
        const isAtBottom = paperContent.scrollTop >= maxScroll - 2;

        if (deltaY > 50 && isAtBottom && !autoScrollTriggered.current) {
          autoScrollTriggered.current = true;
          const totalScrollDistance = 2000 + 2000 + window.innerHeight;

          gsap.to(window, {
            scrollTo: {
              y: `+=${totalScrollDistance}`,
              autoKill: false,
            },
            duration: 3,
            ease: "power2.inOut",
            onComplete: () => {
              autoScrollTriggered.current = false;
            },
          });
        }
      }
      // B. WINDOW INTERACTIONS (Forward & Reverse)
      else {
        // FORWARD AUTO-SCROLL (Window Drag Up / Scroll Down)
        if (deltaY > 50 && isCompleted && !autoScrollTriggered.current) {
          autoScrollTriggered.current = true;
          const totalScrollDistance = 2000 + 2000 + window.innerHeight;

          gsap.to(window, {
            scrollTo: {
              y: `+=${totalScrollDistance}`,
              autoKill: false,
            },
            duration: 3,
            ease: "power2.inOut",
            onComplete: () => {
              autoScrollTriggered.current = false;
            },
          });
          return;
        }
      }

      // C. REVERSE TRANSITION (Drag Down / Scroll Up)
      // If scrolling UP (deltaY < 0 -> Drag Down) and in transition zone
      if (
        deltaY < -50 &&
        window.scrollY > 50 &&
        window.scrollY < 2500 &&
        !autoScrollTriggered.current
      ) {
        autoScrollTriggered.current = true;
        gsap.to(window, {
          scrollTo: 0,
          duration: 2,
          ease: "power2.inOut",
          onComplete: () => {
            autoScrollTriggered.current = false;
          },
        });
      }
    };

    // Attach Listeners
    paperContent.addEventListener("wheel", handlePaperWheel, {
      passive: false,
    });
    window.addEventListener("wheel", handleWindowWheel, { passive: false });

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      paperContent.removeEventListener("wheel", handlePaperWheel);
      window.removeEventListener("wheel", handleWindowWheel);

      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isMounted, isCompleted]);

  const handleTap = () => {
    // Stop floating animation on interaction
    if (isFloatingRef.current) {
      isFloatingRef.current = false;
      floatingTweenRef.current?.kill();
      breathingTweenRef.current?.kill();

      // Reset to center smoothly
      if (envelopeWrapperRef.current) {
        gsap.to(envelopeWrapperRef.current, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          overwrite: true,
        });
      }
    }

    if (timelineRef.current && timelineRef.current.paused()) {
      timelineRef.current.play();
    }
  };

  // Loading State
  if (!isMounted) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.sceneContainer} ${dancingScript.variable}`}
    >
      {/* Background */}
      <div className={styles.backgroundLayer}>
        <Image
          src={galaxyBgSrc}
          alt="Galaxy Background"
          fill
          priority
          className={styles.backgroundImage}
        />
        <canvas ref={starCanvasRef} className={styles.starCanvas} />
      </div>

      {/* 3D Envelope Wrapper */}
      <div
        ref={envelopeWrapperRef}
        className={styles.envelopeWrapper}
        style={{ willChange: "transform" }}
      >
        {/* Layer 1: Back */}
        <div ref={envelopeBackRef} className={styles.envelopeBack} />

        {/* Layer 2: Paper (Starts Inside) */}
        <div ref={paperRef} className={styles.paperContainer}>
          <Image
            src={paperSrc}
            alt="Letter Paper"
            fill
            className={styles.paperImage}
          />
          {/* Content on Paper */}
          <div ref={paperContentRef} className={styles.paperContent}>
            <div className={styles.letterBody}>
              <h1 className={styles.coupleName}>
                {couple?.male_name || "Romeo"}{" "}
                {couple?.male_nickname ? `(${couple.male_nickname})` : ""} &{" "}
                {couple?.female_name || "Juliet"}{" "}
                {couple?.female_nickname ? `(${couple.female_nickname})` : ""}
              </h1>

              <div className={styles.letterDetails}>
                {/* Relationship Dates */}
                {couple?.relationship_start_date && (
                  <p>
                    Our story began on{" "}
                    {new Date(
                      couple.relationship_start_date,
                    ).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}

                {couple?.relationship_stage === "married" &&
                  couple?.married_at && (
                    <p>
                      United forever on{" "}
                      {new Date(couple.married_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}

                {/* Personal Details - Male */}
                <p>
                  <strong>{couple?.male_name}</strong>
                  {couple?.male_birth_date && (
                    <>
                      <br />
                      Born:{" "}
                      {new Date(couple.male_birth_date).toLocaleDateString()}
                    </>
                  )}
                  {couple?.male_city && (
                    <>
                      <br />
                      From: {couple.male_city}
                    </>
                  )}
                  {couple?.male_hobby && (
                    <>
                      <br />
                      Loves: {couple.male_hobby}
                    </>
                  )}
                </p>

                {/* Personal Details - Female */}
                <p>
                  <strong>{couple?.female_name}</strong>
                  {couple?.female_birth_date && (
                    <>
                      <br />
                      Born:{" "}
                      {new Date(couple.female_birth_date).toLocaleDateString()}
                    </>
                  )}
                  {couple?.female_city && (
                    <>
                      <br />
                      From: {couple.female_city}
                    </>
                  )}
                  {couple?.female_hobby && (
                    <>
                      <br />
                      Loves: {couple.female_hobby}
                    </>
                  )}
                </p>

                {/* Notes */}
                {couple?.anniversary_note && (
                  <p className={styles.note}>"{couple.anniversary_note}"</p>
                )}

                {couple?.notes && (
                  <p className={styles.note}>"{couple.notes}"</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Layer 3: Front (Left/Right/Bottom Folds) */}
        <svg
          ref={envelopeFrontRef}
          className={styles.envelopeFront}
          viewBox="0 0 300 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="purpleGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="200"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4C1D95" />
              <stop offset="1" stopColor="#2E1065" />
            </linearGradient>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FCD34D" />
              <stop offset="0.5" stopColor="#D97706" />
              <stop offset="1" stopColor="#FCD34D" />
            </linearGradient>
          </defs>

          {/* Left Fold */}
          <path d="M0 0 L150 115 L0 200 V0 Z" fill="#6D28D9" />
          {/* Right Fold */}
          <path d="M300 0 L150 115 L300 200 V0 Z" fill="#6D28D9" />
          {/* Bottom Fold */}
          <path d="M0 200 L150 100 L300 200 H0 Z" fill="#5B21B6" />

          {/* Gold Trim */}
          <path
            d="M0 200 L150 100 L300 200"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Floral Decorations - Bottom Left */}
          <g opacity="0.9">
            <path
              d="M5 195 Q25 195 35 175 M5 195 Q15 175 5 155 M5 195 Q45 198 65 190"
              stroke="url(#goldGradient)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="35" cy="175" r="2.5" fill="url(#goldGradient)" />
            <circle cx="5" cy="155" r="2" fill="url(#goldGradient)" />
            <circle cx="65" cy="190" r="2" fill="url(#goldGradient)" />
            <path
              d="M15 185 Q25 175 25 185 Q15 195 15 185 Z"
              fill="url(#goldGradient)"
            />
          </g>

          {/* Floral Decorations - Bottom Right */}
          <g opacity="0.9">
            <path
              d="M295 195 Q275 195 265 175 M295 195 Q285 175 295 155 M295 195 Q255 198 235 190"
              stroke="url(#goldGradient)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="265" cy="175" r="2.5" fill="url(#goldGradient)" />
            <circle cx="295" cy="155" r="2" fill="url(#goldGradient)" />
            <circle cx="235" cy="190" r="2" fill="url(#goldGradient)" />
            <path
              d="M285 185 Q275 175 275 185 Q285 195 285 185 Z"
              fill="url(#goldGradient)"
            />
          </g>
        </svg>

        {/* Layer 4: Top Flap (Animated) */}
        <svg
          ref={envelopeFlapRef}
          className={styles.envelopeFlap}
          viewBox="0 0 300 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="flapGradient"
              x1="150"
              y1="0"
              x2="150"
              y2="115"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#5B21B6" />
              <stop offset="1" stopColor="#4C1D95" />
            </linearGradient>
            <linearGradient id="goldGradient2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FCD34D" />
              <stop offset="0.5" stopColor="#D97706" />
              <stop offset="1" stopColor="#FCD34D" />
            </linearGradient>
          </defs>

          <g id="envelope-flap">
            {/* Flap Triangle */}
            <path d="M0 0 L150 115 L300 0 H0 Z" fill="url(#flapGradient)" />

            {/* Gold Border */}
            <path
              d="M0 0 L150 115 L300 0"
              stroke="url(#goldGradient2)"
              strokeWidth="2"
              fill="none"
            />

            {/* Decorative Filigree */}
            <path
              d="M110 80 Q130 90 150 95 Q170 90 190 80"
              stroke="url(#goldGradient2)"
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />

            {/* Gold Wax Seal */}
            <g transform="translate(150, 85)">
              <g className={styles.heartSeal} onClick={handleTap}>
                {/* Irregular Seal Shape */}
                <path
                  d="M0 25 C12 25 22 15 25 5 C27 -8 18 -20 5 -25 C-8 -27 -22 -18 -25 -5 C-27 10 -18 25 0 25 Z"
                  fill="url(#goldGradient2)"
                  stroke="#B45309"
                  strokeWidth="0.5"
                />
                <path
                  d="M-20 0 Q-10 -15 0 -20 Q15 -10 20 5 Q10 20 0 20 Q-15 10 -20 0"
                  fill="none"
                  stroke="#FFF"
                  strokeWidth="0.5"
                  opacity="0.4"
                />

                {/* Inner Embossed Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r="16"
                  stroke="#B45309"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                  fill="none"
                />

                {/* Heart Icon Embossed */}
                <path
                  d="M0 6 C-7 -3 -12 3 -7 9 L0 16 L7 9 C12 3 7 -3 0 6 Z"
                  fill="#92400E"
                  transform="translate(0, -8) scale(0.9)"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Canvas Layer */}
      <canvas ref={canvasRef} className={styles.canvasLayer} />

      {/* Light Orb for Transition */}
      <div ref={lightOrbRef} className={styles.lightOrb} />
    </div>
  );
}
