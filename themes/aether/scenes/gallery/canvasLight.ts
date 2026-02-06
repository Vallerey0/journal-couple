export function initLightCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  let time = 0;
  let animationId: number;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  };

  window.addEventListener("resize", resize);

  const animate = () => {
    ctx.clearRect(0, 0, width, height);
    time += 0.02;

    // Center position (where the altar is)
    // Altar is at bottom, so light should be coming from there-ish?
    // User said "Cahaya muncul di tengah batu". Altar is centered horizontally.
    const centerX = width / 2;
    const centerY = height * 0.75; // Raised higher to be visible above altar

    // Pulsing radius
    const baseRadius = width < 768 ? 100 : 200; // Responsive radius
    const pulse = Math.sin(time) * 30;
    const radius = baseRadius + pulse;

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
    );

    // Warm/Mystical light color - INTENSIFIED
    gradient.addColorStop(0, "rgba(255, 230, 180, 0.6)");
    gradient.addColorStop(0.4, "rgba(200, 180, 255, 0.2)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Soft Beam (No more hard rectangle)
    const beamGradient = ctx.createLinearGradient(
      centerX,
      centerY,
      centerX,
      centerY - 400,
    );
    beamGradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    beamGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = beamGradient;
    ctx.beginPath();
    // Triangle/Trapezoid shape for beam
    ctx.moveTo(centerX - 40, centerY);
    ctx.lineTo(centerX + 40, centerY);
    ctx.lineTo(centerX + 120, centerY - 400);
    ctx.lineTo(centerX - 120, centerY - 400);
    ctx.closePath();
    // Blur it heavily to remove "box" look
    ctx.filter = "blur(20px)";
    ctx.fill();
    ctx.filter = "none";

    animationId = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(animationId);
  };
}
