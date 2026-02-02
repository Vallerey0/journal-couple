export class LightParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private particles: Particle[] = [];
  private animationId: number = 0;
  private active: boolean = false;

  // Configuration
  private spawnRate: number = 5;
  private speedMultiplier: number = 1;
  private type: "falling" | "burst" | "idle" = "idle";

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");
    this.ctx = context;

    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  public resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
    }
  }

  public setMode(mode: "falling" | "burst" | "idle") {
    this.type = mode;
    if (mode === "falling") {
      this.spawnRate = 10;
      this.speedMultiplier = 15; // Fast fall
    } else if (mode === "burst") {
      this.spawnBurst();
    } else {
      this.spawnRate = 0;
    }
  }

  private spawnBurst() {
    // Explosion from center
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 5;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.01,
        size: Math.random() * 3 + 1,
        color: `rgba(255, 255, 200, ${Math.random()})`,
      });
    }
  }

  public start() {
    if (!this.active) {
      this.active = true;
      this.animate();
    }
  }

  public stop() {
    this.active = false;
    cancelAnimationFrame(this.animationId);
  }

  public reset() {
    this.stop();
    this.particles = [];
    this.type = "idle";
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private animate = () => {
    if (!this.active) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Spawning logic for falling mode
    if (this.type === "falling") {
      for (let i = 0; i < this.spawnRate; i++) {
        this.particles.push({
          x: this.width / 2 + (Math.random() - 0.5) * 50, // Narrow stream at top
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 5 + 10, // Fast downward speed
          life: 1.0,
          decay: Math.random() * 0.02 + 0.005,
          size: Math.random() * 2 + 1,
          color: "rgba(255, 255, 255, 0.8)",
        });
      }
    }

    // Update & Draw
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > this.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color.replace(/, [\d.]+\)$/, `, ${p.life})`);
      this.ctx.fill();
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  public destroy() {
    this.stop();
    window.removeEventListener("resize", this.resize);
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
}
