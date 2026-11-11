export type Point = [number, number];

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
/** Progress of `t` through the window [start, end], clamped to 0–1. */
export const span = (t: number, start: number, end: number) => clamp((t - start) / (end - start));
export const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
export const easeOut = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
export const easeIn = (v: number) => Math.pow(clamp(v), 2);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Stable pseudo-random value in [0, 1) for integer inputs. */
export function hash(x: number, y = 0, z = 0): number {
  let h =
    Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x2c1b3c6d);
  h = Math.imul(h ^ 0x5bd1e995 ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Interpolate keyframes [t, value] with an ease at every stop, like a motor
 * that slows before each change of direction. */
export function keyframes(frames: [number, number][], t: number): number {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i];
    if (t <= t1) {
      const [t0, v0] = frames[i - 1];
      return mix(v0, v1, smooth((t - t0) / (t1 - t0)));
    }
  }
  return frames[frames.length - 1][1];
}

// 4×4 ordered-dither thresholds, scaled to the 0–255 alpha range.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) * 16);

export const SKY = '#060915';

/**
 * Draws onto a deliberately coarse backing grid that the browser upscales
 * with `image-rendering: pixelated`. Three coordinate spaces are available:
 *  - grid():   one unit per art pixel
 *  - screen(): CSS pixels of the viewport
 *  - scene():  centred scene units, scaled to fit a ~440×460 design box
 */
export class Painter {
  readonly ctx: CanvasRenderingContext2D;
  /** Viewport size in CSS pixels. */
  w = 0;
  h = 0;
  /** CSS pixels per art pixel. */
  px = 4;
  cols = 0;
  rows = 0;
  /** CSS pixels per scene unit. */
  scale = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.resize();
  }

  /** One art pixel, measured in scene units. Use it to size strokes. */
  get unit(): number {
    return this.px / this.scale;
  }
  /** Half the viewport, measured in scene units. */
  get halfWidth(): number {
    return this.w / 2 / this.scale;
  }
  get halfHeight(): number {
    return this.h / 2 / this.scale;
  }

  resize(): void {
    const w = innerWidth,
      h = innerHeight,
      dpr = devicePixelRatio || 1;
    this.w = w;
    this.h = h;
    this.scale = Math.min(w / 440, h / 460, 1.35);
    // About three scene units per art pixel keeps every scene equally chunky on
    // any screen; very large screens get bigger pixels to bound the per-frame
    // work. Snapping to whole device pixels keeps the upscaled grid even.
    const target = Math.max(2, 3 * this.scale, Math.sqrt((w * h) / 320000));
    this.px = Math.max(1, Math.round(target * dpr)) / dpr;
    this.cols = Math.ceil(w / this.px);
    this.rows = Math.ceil(h / this.px);
    this.canvas.width = this.cols;
    this.canvas.height = this.rows;
    this.canvas.style.width = `${this.cols * this.px}px`;
    this.canvas.style.height = `${this.rows * this.px}px`;
  }

  grid(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  screen(): void {
    this.ctx.setTransform(1 / this.px, 0, 0, 1 / this.px, 0, 0);
  }
  scene(): void {
    this.screen();
    this.ctx.translate(this.w / 2, this.h / 2);
    this.ctx.scale(this.scale, this.scale);
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }
  circle(x: number, y: number, r: number, color: string): void {
    if (r <= 0) return;
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }
  ring(x: number, y: number, r: number, color: string, width: number): void {
    if (r <= 0) return;
    const c = this.ctx;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.stroke();
  }
  ellipse(x: number, y: number, rx: number, ry: number, color: string): void {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, TAU);
    c.fill();
  }
  poly(points: Point[], color: string): void {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  }
  line(points: Point[], color: string, width: number): void {
    const c = this.ctx;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
  /** Light as three flat bands, the way pixel art fakes a glow. */
  glow(x: number, y: number, r: number, color: string, strength = 1): void {
    if (strength <= 0 || r <= 0) return;
    this.alpha(strength * 0.16, () => this.circle(x, y, r, color));
    this.alpha(strength * 0.22, () => this.circle(x, y, r * 0.66, color));
    this.alpha(strength * 0.32, () => this.circle(x, y, r * 0.4, color));
  }
  alpha(value: number, draw: () => void): void {
    if (value <= 0) return;
    const c = this.ctx,
      previous = c.globalAlpha;
    c.globalAlpha = previous * Math.min(1, value);
    draw();
    c.globalAlpha = previous;
  }
  /** Run `draw` with the current transform and state restored afterwards. */
  save(draw: () => void): void {
    this.ctx.save();
    draw();
    this.ctx.restore();
  }

  /** Opaque night sky with a sparse, gently twinkling star field. */
  backdrop(seconds: number): void {
    const { ctx, cols, rows } = this;
    this.grid();
    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, cols, rows);
    const count = Math.round((cols * rows) / 160);
    for (let i = 0; i < count; i++) {
      const x = Math.floor(hash(i, 1) * cols),
        y = Math.floor(hash(i, 2) * rows),
        kind = hash(i, 3);
      let level = 0.25 + hash(i, 4) * 0.45;
      if (kind > 0.78) level *= 0.55 + 0.45 * Math.sin(seconds * (1.4 + hash(i, 5) * 2.2) + i);
      ctx.globalAlpha = clamp(level);
      ctx.fillStyle = kind > 0.93 ? '#e8d4b4' : kind > 0.5 ? '#aebcda' : '#6c7ca6';
      ctx.fillRect(x, y, 1, 1);
      if (kind > 0.985) {
        ctx.globalAlpha = clamp(level * 0.45);
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Cover everything drawn so far with black, for fading in from the dark. */
  darken(amount: number): void {
    if (amount <= 0) return;
    this.grid();
    this.alpha(amount, () => this.rect(0, 0, this.cols, this.rows, '#000'));
  }

  /** Erase a disc (in screen pixels) so the page underneath shows through. */
  erase(draw: () => void): void {
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    draw();
    c.restore();
  }

  /** Quantise every partially transparent art pixel to on/off with ordered
   * dithering, so fades and reveals dissolve pixel by pixel. */
  finish(): void {
    const { ctx, cols, rows } = this;
    const image = ctx.getImageData(0, 0, cols, rows),
      data = image.data;
    for (let y = 0, i = 3; y < rows; y++) {
      const row = (y & 3) << 2;
      for (let x = 0; x < cols; x++, i += 4) {
        const a = data[i];
        if (a !== 0 && a !== 255) data[i] = a > BAYER[row | (x & 3)] ? 255 : 0;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
}

export interface Scene {
  draw(t: number, seconds: number): void;
}
