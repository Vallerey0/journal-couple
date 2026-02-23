import gsap from "gsap";
import { triggerLightBurst } from "./canvasLight";

interface Refs {
  sceneContainer: HTMLDivElement;
  envelopeWrapper: HTMLDivElement;
  envelopeBack: HTMLDivElement;
  envelopeFront: SVGSVGElement;
  envelopeFlap: SVGSVGElement;
  paperContainer: HTMLDivElement;
  paperContent: HTMLDivElement;
  canvas: HTMLCanvasElement;
}

export const buildTimeline = (
  refs: Refs,
  onComplete: () => void,
  onReady?: () => void,
) => {
  const tl = gsap.timeline({
    paused: true,
    onComplete,
  });

  tl.set(refs.envelopeWrapper, {
    xPercent: -50,
    yPercent: -60,
    rotate: 0,
    scale: 0.3,
    opacity: 0,
    x: 0,
  })
    .set(refs.envelopeFlap, { rotationX: 0 }) // Closed
    .set(refs.paperContainer, {
      y: 0,
      xPercent: -50,
      yPercent: -50, // Center vertically in wrapper
      top: "50%",
      left: "50%",
      scale: 0.28,
      opacity: 1,
    })
    .set(refs.paperContent, { opacity: 0 });

  tl.to(refs.envelopeWrapper, {
    duration: 1.2,
    ease: "power2.out",
    keyframes: [
      { opacity: 1, scale: 0.5, yPercent: -55, x: -20 },
      { scale: 0.8, yPercent: -52, x: 20 },
      { scale: 1, yPercent: -50, x: 0 },
    ],
  });

  // 3. Ready State Label
  tl.addLabel("ready");

  // Trigger idle animations if provided
  if (onReady) {
    tl.call(onReady);
  }

  // 4. PAUSE for User Interaction
  tl.addPause();

  // 6. Open Flap
  tl.to(refs.envelopeFlap, {
    rotationX: 180,
    duration: 0.6,
    ease: "power2.inOut",
    transformOrigin: "50% 0%", // Top edge
  });

  // Fix: Set Flap Z-Index to behind paper (or 0) so paper slides OVER it
  // Since paper is z-index 2, setting flap to 0 works.
  tl.set(refs.envelopeFlap, { zIndex: 0 });

  // 8. Paper Slides Out & Expands Immediately
  // We combine the slide out and expansion into one seamless motion
  tl.addLabel("expand");

  // Move Z-Index to front almost immediately so it covers the envelope
  tl.set(refs.paperContainer, { zIndex: 50 }, "expand");

  // Animate: Envelope Parts Drop Down & Fade Out
  tl.to(
    [refs.envelopeBack, refs.envelopeFront, refs.envelopeFlap],
    {
      y: "50vh", // Drop down significantly
      opacity: 0,
      duration: 1.5,
      ease: "power2.inOut",
    },
    "expand",
  );

  // Animate: Paper Expands to Full Screen (Modern Transition)
  tl.to(
    refs.paperContainer,
    {
      y: 0,
      x: 0,
      top: "50%",
      left: "50%",
      xPercent: -50,
      yPercent: -50,
      scale: 1, // Zoom to full size
      duration: 1.5, // Faster expansion
      ease: "power2.out", // Start expanding immediately
      force3D: true, // Hardware acceleration
    },
    "expand",
  );

  // Trigger Light Burst
  tl.call(
    () => {
      triggerLightBurst(refs.canvas);
    },
    undefined,
    "expand+=1.0", // Delayed to avoid heavy overlap with resize
  );

  // Typewriter effect logic handled in React component via useEffect or CSS?
  // Since we want to trigger it from GSAP timeline, we can just fade in the container
  // and let the text appear. For "write mode", we can use staggering.

  tl.to(
    refs.paperContent,
    {
      opacity: 1,
      duration: 1,
      ease: "power2.out",
    },
    "expand+=0.8",
  );

  // Animate text children staggering
  // Note: refs.paperContent has children .letterBody -> children
  // This is a bit fragile if structure changes, but works for now.
  // Better to pass specific refs if possible, but we'll select via class in the component if needed.
  // Actually, standard GSAP stagger on children works if we select them.
  // But refs.paperContent contains a div which contains h1 and div.

  return tl;
};
