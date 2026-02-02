import gsap from "gsap";
import { ConstellationCanvas } from "./canvasConstellation";
import { LightParticleSystem } from "./canvasLight";

interface Refs {
  sceneContainer: HTMLDivElement;
  lightCore: HTMLDivElement;
  zodiacContainer: HTMLDivElement;
  zodiacRing: HTMLDivElement;
  unifiedCard: HTMLDivElement;
  compatibilitySection: HTMLDivElement;
  canvas: HTMLCanvasElement;
  lightCanvas: HTMLCanvasElement;
  background: HTMLImageElement;
}

export const buildZodiacTimeline = (
  refs: Refs,
  constellationCanvas: ConstellationCanvas | null,
  lightSystem: LightParticleSystem | null,
  maleSign: string,
  femaleSign: string,
) => {
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.out" },
  });

  // 1. PHASE 1: FALLING LIGHT (Transition from Intro)
  // Lock scroll immediately
  tl.call(
    () => {
      document.body.style.overflow = "hidden";
    },
    undefined,
    0,
  );

  // Simulate "paper crumbling into light" by starting with a falling stream

  // Background Settle (simulate landing from warp)
  tl.fromTo(
    refs.background,
    { scale: 1.2, filter: "blur(10px)", opacity: 0.8 },
    {
      scale: 1,
      filter: "blur(0px)",
      opacity: 1,
      duration: 2.0,
      ease: "power2.out",
    },
    0,
  );

  tl.call(
    () => {
      lightSystem?.setMode("falling");
      lightSystem?.start();
    },
    undefined,
    0,
  );

  // Animate the "impact" of the light falling
  // Start from top of screen (assuming 100vh height, -50% is center, so -150% is top approx)
  // actually using vh units in y is safer if possible, but pixels work if we assume height.
  // -window.innerHeight/2 is center to top.
  tl.set(refs.lightCore, { opacity: 0, scale: 0, y: -window.innerHeight });

  // Light Core falls down
  tl.to(
    refs.lightCore,
    {
      y: 0,
      opacity: 1,
      scale: 0.5,
      duration: 2.0, // Slower fall
      ease: "power2.in",
    },
    0.5,
  );

  // Impact -> Burst
  tl.call(
    () => {
      lightSystem?.setMode("burst");
    },
    undefined,
    2.5,
  );

  // 2. PHASE 2: ICONS REVEAL & SLOW SPIN
  // Show the ring immediately after burst
  tl.set(refs.zodiacRing, { opacity: 0, scale: 0.5, rotation: 0 });

  tl.to(
    refs.zodiacRing,
    {
      opacity: 1,
      scale: 1,
      rotation: 90, // Just a quarter turn to settle
      duration: 3.0, // Slow reveal
      ease: "power2.out",
    },
    2.5,
  );

  // Core pulses during spin
  tl.to(
    refs.lightCore,
    {
      scale: 1.5,
      duration: 1.0,
      yoyo: true,
      repeat: 3,
    },
    2.5,
  );

  // 3. PHASE 3: CONSTELLATION FORMATION (During spin/settle)
  // We animate the canvas drawing via a proxy object
  const progressProxy = { value: 0 };

  tl.to(
    progressProxy,
    {
      value: 1,
      duration: 3,
      ease: "power2.inOut",
      onUpdate: () => {
        if (constellationCanvas) {
          constellationCanvas.setProgress(progressProxy.value);
        }
      },
    },
    2.5,
  );

  // 4. PHASE 4: REVEAL CARDS (Burst downwards)
  // Stop particles
  tl.call(
    () => {
      lightSystem?.setMode("idle");
    },
    undefined,
    4.0,
  );

  // Reveal cards from center
  tl.set(refs.zodiacContainer, { opacity: 1 });

  tl.fromTo(
    refs.unifiedCard,
    {
      y: -50, // Start from center/top
      opacity: 0,
      scale: 0.2,
    },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: "back.out(1.2)",
    },
    4.0,
  );

  // 5. PHASE 5: SLOW SPIN (Continuous)
  tl.to(
    refs.zodiacRing,
    {
      rotation: "+=360",
      duration: 60, // Very slow continuous spin
      repeat: -1,
      ease: "linear",
    },
    4.0,
  );

  // 6. PHASE 6: COMPATIBILITY REVEAL
  tl.to(
    refs.compatibilitySection,
    {
      opacity: 1,
      y: 0,
      duration: 1.5,
      delay: 0.5,
    },
    5.0,
  );

  // 7. UNLOCK SCROLL
  tl.call(
    () => {
      document.body.style.overflow = "auto";
    },
    undefined,
    5.5,
  );

  return tl;
};
