import { CONSTELLATIONS, ConstellationData } from "./assets/constellation-data";

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  alpha: number;
  active: boolean;
}

export class ConstellationCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private particles: Particle[] = [];
  private constellation: ConstellationData | null = null;
  private progress: number = 0; // 0 to 1
  private animationId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");
    this.ctx = context;

    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  public setConstellation(sign: string) {
    const data = CONSTELLATIONS[sign.toLowerCase()];
    if (data) {
      this.constellation = data;
      this.initParticles();
    }
  }

  public setProgress(value: number) {
    this.progress = Math.max(0, Math.min(1, value));
    this.draw();
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement?.getBoundingClientRect();

    if (rect) {
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.scale(dpr, dpr);
    }

    // Re-init if constellation exists to adjust positions
    if (this.constellation) {
      this.initParticles();
    }
    this.draw();
  }

  private initParticles() {
    if (!this.constellation) return;

    this.particles = this.constellation.stars.map((star) => {
      // Map relative coordinates (0-100) to canvas size
      // Add padding (20%)
      const paddingX = this.width * 0.2;
      const paddingY = this.height * 0.2;
      const usableW = this.width - paddingX * 2;
      const usableH = this.height - paddingY * 2;

      return {
        x: this.width / 2, // Start from center
        y: 0, // Start from top (falling effect)
        targetX: paddingX + (star.x / 100) * usableW,
        targetY: paddingY + (star.y / 100) * usableH,
        size: Math.random() * 2 + 1,
        alpha: 0,
        active: true,
      };
    });
  }

  public draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (!this.constellation) return;

    // Draw Lines first (if progress > 0.5)
    if (this.progress > 0.3) {
      const lineProgress = (this.progress - 0.3) / 0.7; // Normalize 0-1

      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${lineProgress * 0.5})`;
      this.ctx.lineWidth = 1;

      this.constellation.lines.forEach((line) => {
        const start = this.particles[line.from];
        const end = this.particles[line.to];

        if (start && end) {
          // Lerp positions based on current progress
          const curStartX =
            start.x +
            (start.targetX - start.x) * Math.min(1, this.progress * 2);
          const curStartY =
            start.y +
            (start.targetY - start.y) * Math.min(1, this.progress * 2);

          const curEndX =
            end.x + (end.targetX - end.x) * Math.min(1, this.progress * 2);
          const curEndY =
            end.y + (end.targetY - end.y) * Math.min(1, this.progress * 2);

          this.ctx.moveTo(curStartX, curStartY);
          this.ctx.lineTo(curEndX, curEndY);
        }
      });
      this.ctx.stroke();
    }

    // Draw Stars
    this.particles.forEach((p, i) => {
      // Animate position: Falling then settling
      // Phase 1: Fall (0 - 0.5)
      // Phase 2: Settle (0.5 - 1.0)

      const moveProgress = Math.min(1, this.progress * 2); // 0 -> 1 quickly

      // Lerp
      const currentX = p.x + (p.targetX - p.x) * moveProgress;
      const currentY = p.y + (p.targetY - p.y) * moveProgress;

      // Alpha
      const alpha = Math.min(1, this.progress * 3);

      this.ctx.beginPath();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Glow
      if (this.progress > 0.8) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = "white";
      } else {
        this.ctx.shadowBlur = 0;
      }
    });
  }

  public destroy() {
    window.removeEventListener("resize", this.resize);
  }
}
