export class StarBackground {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private width: number = 0;
  private height: number = 0;
  private animationId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");
    this.ctx = context;

    this.resize();
    // Bind resize to the instance
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);

    this.initStars();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
  }

  private initStars() {
    this.stars = [];
    const starCount = 150; // Enough for a nice field
    for (let i = 0; i < starCount; i++) {
      this.stars.push(new Star(this.width, this.height));
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.stars.forEach((star) => {
      star.update(this.width, this.height);
      star.draw(this.ctx);
    });

    this.animationId = requestAnimationFrame(this.animate);
  }

  public destroy() {
    window.removeEventListener("resize", this.resize);
    cancelAnimationFrame(this.animationId);
  }
}

class Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 1.5 + 0.5; // Small stars
    this.opacity = Math.random();
    // Very slow drift
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
  }

  update(width: number, height: number) {
    this.x += this.speedX;
    this.y += this.speedY;

    // Wrap around screen
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    // Gentle twinkle
    this.opacity += (Math.random() - 0.5) * 0.02;
    if (this.opacity < 0.1) this.opacity = 0.1;
    if (this.opacity > 0.8) this.opacity = 0.8;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
