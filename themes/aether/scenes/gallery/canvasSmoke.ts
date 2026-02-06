export function initFogCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const particles: FogParticle[] = [];
  const FOG_COUNT = 400; // Increased count for dense small particles

  type FogParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    noiseOffset: number;
  };

  function createParticle(initial = false): FogParticle {
    return {
      x: initial ? Math.random() * width : -100,
      y: height * 0.8 + Math.random() * (height * 0.2), // Bottom 20% ONLY (Below cards)
      vx: Math.random() * 1.5 + 0.5, // Faster flow for "smoke" feel
      vy: (Math.random() - 0.5) * 0.5, // Slight turbulence
      size: Math.random() * 60 + 30, // Small particles (30-90px)
      opacity: Math.random() * 0.12 + 0.03, // Slightly reduced opacity (was 0.15 + 0.05)
      noiseOffset: Math.random() * 1000,
    };
  }

  for (let i = 0; i < FOG_COUNT; i++) {
    particles.push(createParticle(true));
  }

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  };
  window.addEventListener("resize", resize);

  function noise(n: number) {
    return Math.sin(n) * 0.5 + Math.sin(n * 0.5) * 0.25;
  }

  let animationId: number;

  const animate = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    for (const p of particles) {
      p.noiseOffset += 0.002;
      const drift = noise(p.noiseOffset);

      p.x += p.vx;
      p.y += drift * 0.2; // Slight vertical Bobbing

      if (p.x > width + p.size) {
        Object.assign(p, createParticle());
      }

      // Cloud Gradient - Simple puff
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);

      // White/Grey Smoke
      // Lower alpha multiplier for subtle transparency (0.6x factor)
      gradient.addColorStop(0, `rgba(220, 220, 230, ${p.opacity * 0.6})`);
      gradient.addColorStop(1, "rgba(220, 220, 230, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    animationId = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
  };
}
