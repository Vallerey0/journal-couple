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
    if (starCanvasRef.current) {
      starBg = new StarBackground(starCanvasRef.current);
    }

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
          // On Complete
          setIsCompleted(true);
          document.body.style.overflow = ""; // Unlock scroll

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
            });
          }
        },
      );

      // Start the timeline
      timelineRef.current.play();

      // --- EXIT ANIMATION (Crumple -> Light Orb -> Fall) ---
      if (
        envelopeWrapperRef.current &&
        lightOrbRef.current &&
        starCanvasRef.current
      ) {
        const exitTl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "+=2000",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        // 1. Crumple Paper & Reveal Light
        exitTl
          .to(
            envelopeWrapperRef.current,
            {
              scale: 0,
              rotation: 360,
              opacity: 0,
              duration: 1,
              ease: "expo.in",
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
      }
    }, containerRef);

    return () => {
      ctx.revert();
      if (starBg) starBg.destroy();
      document.body.style.overflow = "";
    };
  }, [isMounted]);

  // Handle Scroll Interactions (Paper & Window)
  useEffect(() => {
    if (!isMounted || !paperContentRef.current) return;

    const paperContent = paperContentRef.current;
    let touchStartY = 0;

    // --- 1. PAPER SCROLL HANDLER (Inside the letter) ---
    const handlePaperWheel = (e: WheelEvent) => {
      // Block interaction if auto-scroll is running
      if (autoScrollTriggered.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!timelineRef.current || timelineRef.current.progress() < 0.99) return;

      // A. SCROLL UP: Reverse letter (Close)
      if (e.deltaY < 0 && paperContent.scrollTop <= 0) {
        document.body.style.overflow = "hidden"; // Re-lock scroll
        timelineRef.current.tweenTo("ready");
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

      // If scrolling UP (deltaY < 0) inside the transition zone (and letter is open)
      // We want to handle "Reverse Auto-Scroll" back to top of intro
      const scrollY = window.scrollY;
      const transitionZoneEnd = 2500;

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
            duration: 5,
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
          const isNearBottom = paperContent.scrollTop >= maxScroll - 50;
          const willHitBottom = paperContent.scrollTop + e.deltaY >= maxScroll;
          if (isNearBottom || willHitBottom) {
            shouldTrigger = true;
          }
        } else {
          // Window scroll: if letter is completed/open, check paper scroll first
          if (isCompleted) {
            const maxScroll =
              paperContent.scrollHeight - paperContent.clientHeight;
            const isAtBottom = paperContent.scrollTop >= maxScroll - 10;

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
          const totalScrollDistance = 2000 + 2000 + window.innerHeight;

          gsap.to(window, {
            scrollTo: {
              y: `+=${totalScrollDistance}`,
              autoKill: false,
            },
            duration: 5,
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
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Block interaction if auto-scroll is running
      if (autoScrollTriggered.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!timelineRef.current || timelineRef.current.progress() < 0.99) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY; // Positive = Scroll Down (Drag Up)

      // A. PAPER INTERACTIONS
      if (
        e.target === paperContent ||
        paperContent.contains(e.target as Node)
      ) {
        // 1. PULL DOWN: Reverse letter (Close)
        if (deltaY < -50 && paperContent.scrollTop <= 0) {
          document.body.style.overflow = "hidden";
          timelineRef.current.tweenTo("ready");
          setIsCompleted(false);
          return;
        }

        // 2. PULL UP: Auto-scroll Forward
        const maxScroll = paperContent.scrollHeight - paperContent.clientHeight;
        const isNearBottom = paperContent.scrollTop >= maxScroll - 50;

        if (deltaY > 50 && isNearBottom && !autoScrollTriggered.current) {
          autoScrollTriggered.current = true;
          const totalScrollDistance = 2000 + 2000 + window.innerHeight;

          gsap.to(window, {
            scrollTo: {
              y: `+=${totalScrollDistance}`,
              autoKill: false,
            },
            duration: 5,
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
            duration: 5,
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
          duration: 5,
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
  }, [isMounted, isCompleted]); // Added isCompleted dependency

  const handleTap = () => {
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
      <div ref={envelopeWrapperRef} className={styles.envelopeWrapper}>
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
          {/* Left Fold */}
          <path d="M0 0 L150 110 L0 200 V0 Z" fill="#FBCFE8" />
          {/* Right Fold */}
          <path d="M300 0 L150 110 L300 200 V0 Z" fill="#FBCFE8" />
          {/* Bottom Fold */}
          <path d="M0 200 L150 90 L300 200 H0 Z" fill="#F9A8D4" />
        </svg>

        {/* Layer 4: Top Flap (Animated) */}
        <svg
          ref={envelopeFlapRef}
          className={styles.envelopeFlap}
          viewBox="0 0 300 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="envelope-flap">
            {/* Flap Triangle */}
            <path d="M0 0 L150 110 L300 0 H0 Z" fill="#F9A8D4" />
            {/* Highlight/Shadow */}
            <path
              d="M0 0 L150 110 L300 0"
              stroke="#EC4899"
              strokeWidth="1"
              strokeOpacity="0.3"
            />

            {/* Heart Seal */}
            <g transform="translate(150, 85)">
              <g className={styles.heartSeal} onClick={handleTap}>
                <path
                  d="M0 10 C-10 -5 -25 5 -12 20 L0 32 L12 20 C25 5 10 -5 0 10 Z"
                  fill="#BE185D"
                  stroke="#9D174D"
                  strokeWidth="2"
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
