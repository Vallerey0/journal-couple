"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import styles from "./styles.module.css";
import { CoupleHoroscope, ZodiacSceneProps } from "./types";
import { ConstellationCanvas } from "./canvasConstellation";
import { LightParticleSystem } from "./canvasLight";
import { buildZodiacTimeline } from "./motion";
import galaxyBgSrc from "./assets/galaxy-bg.jpg";
import zodiacIconsSrc from "./assets/zodiac-icons.svg";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

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
  const compatibilityRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const constellationRef = useRef<ConstellationCanvas | null>(null);
  const lightSystemRef = useRef<LightParticleSystem | null>(null);

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

      // ScrollTrigger to PLAY
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top center",
        onEnter: () => {
          timelineRef.current?.play();
        },
        onLeaveBack: () => {
          timelineRef.current?.pause(0);
          lightSystemRef.current?.reset();
          document.body.style.overflow = "auto";
        },
      });
    }, containerRef);

    return () => {
      ctx.revert();
      constellation.destroy();
      lightSystem.destroy();
      document.body.style.overflow = "auto";
      // ScrollTrigger is reverted by ctx.revert() automatically if created inside context
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
          <div className={styles.cardContent}>
            <div className={styles.coupleRow}>
              {/* Male Side */}
              <div className={styles.personInfo}>
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

            {/* Phase 6: Compatibility */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
