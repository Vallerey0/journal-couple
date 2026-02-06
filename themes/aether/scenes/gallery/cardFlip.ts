import gsap from "gsap";

export const animateCardOpen = (
  card: HTMLElement,
  cardInner: HTMLElement,
  targetZ: number,
  targetRotationY: number,
  targetScale: number = 1.5,
) => {
  const tl = gsap.timeline();

  // Move card closer (z-axis) and scale up
  // AND FLIP to absolute target rotation (Back Face)
  // We force x: 0 and y: 0 to ensure it is perfectly centered on screen
  // (Assuming the ring is rotated to center this card)
  tl.to(card, {
    x: 0, // Center horizontally
    z: targetZ,
    scale: targetScale,
    rotationY: targetRotationY,
    y: 0, // Center vertically
    duration: 0.8,
    ease: "power3.inOut",
    zIndex: 100, // Ensure on top
  });

  return tl;
};

export const animateCardClose = (
  card: HTMLElement,
  cardInner: HTMLElement,
  originalX: number,
  originalZ: number,
  originalRotationY: number,
) => {
  const tl = gsap.timeline();

  tl.to(
    card,
    {
      x: originalX, // Restore original X position
      z: originalZ,
      scale: 1,
      rotationY: originalRotationY, // Flip back to original (Front Face)
      y: 0,
      duration: 0.8,
      ease: "power3.inOut",
      zIndex: 1, // Reset zIndex
      clearProps: "zIndex", // Allow original stacking
    },
    0,
  );

  return tl;
};
