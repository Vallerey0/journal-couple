export function triggerLightBurst(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set canvas size
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Configuration
  const particleCount = 30; // Reduced from 60 for performance
  const particles: Particle[] = [];
  const centerX = width / 2;
  const centerY = height / 2;

  // Particle Class
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;

    constructor() {
      this.x = centerX;
      this.y = centerY;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 5; // Fast burst
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.maxLife = Math.random() * 50 + 50;
      this.life = this.maxLife;
      this.size = Math.random() * 4 + 2;

      // Gold/White/Warm colors
      const colors = ["#ffffff", "#fff8e7", "#ffd700", "#ffcc00"];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.95; // Friction
      this.vy *= 0.95;
      this.life--;
      this.size *= 0.98; // Shrink
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Add central flash
  let flashOpacity = 1;

  // Animation Loop
  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Draw Flash
    if (flashOpacity > 0) {
      ctx.globalCompositeOperation = "source-over";
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        width / 2,
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${flashOpacity})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      flashOpacity -= 0.05;
    }

    // Draw Particles
    ctx.globalCompositeOperation = "lighter";
    let activeParticles = false;
    particles.forEach((p) => {
      if (p.life > 0) {
        p.update();
        p.draw(ctx);
        activeParticles = true;
      }
    });

    if (activeParticles || flashOpacity > 0) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, width, height); // Cleanup
    }
  }

  animate();
}
