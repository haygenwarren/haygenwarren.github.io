import { ArrivalKind } from '../../../core/services/arrival.service';

export const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
type Point = [number, number];

/** Scene artwork drawn on a subtle pixel grid, with larger tiles for the reveals. */
export class ArrivalRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private scale = 1;
  private home: HTMLCanvasElement | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    this.width = innerWidth;
    this.height = innerHeight;
    // A light 1.5–2 CSS-pixel grid matches the deep field without obscuring detail.
    const pixelSize = this.width < 600 ? 1.5 : 2;
    this.canvas.width = Math.ceil(this.width / pixelSize);
    this.canvas.height = Math.ceil(this.height / pixelSize);
    this.ctx.setTransform(
      this.canvas.width / this.width,
      0,
      0,
      this.canvas.height / this.height,
      0,
      0,
    );
    this.scale = Math.min(this.width / 440, this.height / 460, 1.35);
    this.home = null;
  }

  draw(kind: ArrivalKind, t: number): void {
    const c = this.ctx,
      w = this.width,
      h = this.height;
    this.scale =
      kind === 'camera' ? Math.min(w / 360, h / 390, 1.8) : Math.min(w / 440, h / 460, 1.35);
    if (!this.home) this.home = this.captureHome();
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#050812';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 95; i++) {
      c.fillStyle = i % 5 ? '#29364b' : '#65748d';
      this.circle((i * 137.7 + 31) % w, (i * 91.3 + 53) % h, i % 5 ? 0.65 : 1);
    }
    c.save();
    c.translate(w / 2, h / 2);
    c.scale(this.scale, this.scale);
    if (kind === 'telescope') this.telescope(t);
    if (kind === 'camera') {
      if (t > 0.85) {
        const u = ease((t - 0.85) / 0.15);
        // Move the camera toward the center frame: the entire film strip grows
        // around that frame, rather than lifting a separate image off the film.
        c.translate(0, -51 * (1 - u));
        c.scale(Math.pow(w / (54 * this.scale), u), Math.pow(h / (38 * this.scale), u));
        c.translate(0, 51);
      }
      this.camera(t);
    }
    if (kind === 'rocket') this.rocket(t);
    if (kind === 'merger') this.merger(t);
    c.restore();

    if (kind === 'telescope') {
      let detected = 0;
      for (let i = 0; i < 7; i++) detected += ease((t - (0.3 + i * 0.08)) / 0.025);
      this.dissolve(detected / 7, true, ease((t - 0.8) / 0.2));
    }
    if (kind === 'rocket') {
      this.plume(t);
      this.dissolve(ease((t - 0.86) / 0.14));
    }
    if (kind === 'merger') {
      this.explosion(t);
      this.dissolve(ease((t - 0.85) / 0.15));
    }
    if (kind === 'camera' && t > 0.85) this.zoomFrame(t);
  }

  private circle(x: number, y: number, r: number): void {
    if (r <= 0) return;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fill();
  }
  private line(points: Point[], color: string, width = 1): void {
    const c = this.ctx;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
  private polygon(points: Point[], fill: string): void {
    const c = this.ctx;
    c.fillStyle = fill;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  }
  private rect(x: number, y: number, w: number, h: number, color: string, radius = 0): void {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, radius);
    c.fill();
  }
  private glow(x: number, y: number, r: number, color: string): void {
    const c = this.ctx,
      g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    c.fillStyle = g;
    this.circle(x, y, r);
  }

  private telescope(t: number): void {
    const c = this.ctx;
    // Keep the shallow VLA-inspired dish and a clean, solid elevation mount.
    this.line(
      [
        [-75, 132],
        [75, 132],
      ],
      '#253044',
    );
    this.polygon(
      [
        [-31, 125],
        [-14, 34],
        [14, 34],
        [31, 125],
      ],
      '#9cabbc',
    );
    this.polygon(
      [
        [-14, 34],
        [-7, 34],
        [-15, 125],
        [-31, 125],
      ],
      '#c6cfd8',
    );
    this.rect(-43, 125, 86, 8, '#788b9e', 2);
    this.rect(-21, 23, 42, 17, '#c5ced7', 3);
    this.polygon(
      [
        [-30, -5],
        [-20, 27],
        [20, 27],
        [30, -5],
        [20, -5],
        [12, 15],
        [-12, 15],
        [-20, -5],
      ],
      '#a8b7c7',
    );
    c.save();
    c.translate(0, 12);
    const lock = ease(t / 0.17);
    c.rotate(-0.12 + Math.sin(t * 28) * 0.14 * (1 - lock));
    c.translate(0, -12);
    const project = (x: number, y: number): Point => [x, -18 + y * 0.38 - (x * x + y * y) / 312];
    const surface = c.createLinearGradient(0, -75, 0, 25);
    surface.addColorStop(0, '#f3f2ec');
    surface.addColorStop(0.55, '#cad4dd');
    surface.addColorStop(1, '#8c9eaf');
    c.fillStyle = surface;
    c.beginPath();
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      const p = project(Math.cos(a) * 84, Math.sin(a) * 84);
      i ? c.lineTo(...p) : c.moveTo(...p);
    }
    c.closePath();
    c.fill();
    for (const r of [42, 84]) {
      const points: Point[] = [];
      for (let i = 0; i <= 80; i++) {
        const a = (i / 80) * Math.PI * 2;
        points.push(project(Math.cos(a) * r, Math.sin(a) * r));
      }
      this.line(points, r === 84 ? '#f0f2ee' : '#92a3b3', r === 84 ? 2 : 0.65);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const points: Point[] = [];
      for (let r = 6; r <= 84; r += 3) points.push(project(Math.cos(a) * r, Math.sin(a) * r));
      this.line(points, '#94a5b4', 0.6);
    }
    const focus: Point = [0, -91];
    for (const a of [Math.PI * 0.15, Math.PI * 0.85]) {
      const foot = project(Math.cos(a) * 80, Math.sin(a) * 80);
      this.line([foot, focus], '#5c6c80', 3.5);
      this.line(
        [
          [foot[0] - 1, foot[1] - 1],
          [-1, -92],
        ],
        '#e3e6e8',
        1.5,
      );
    }
    this.rect(-8, -96, 16, 9, '#dfe3e4', 2);
    this.rect(-5, -87, 10, 5, '#9daebc');
    this.rect(-7, -21, 14, 9, '#718697', 3);
    const source: Point = [0, -177];
    this.glow(...source, 16, '#bce6ff80');
    c.fillStyle = '#e3f6ff';
    this.circle(...source, 2.8);
    // Every packet travels to an actual point on the reflector, bounces upward
    // to the subreflector, then returns to the central feed. Reception drives reveal.
    for (let i = 0; i < 7; i++) {
      const u = (t - (0.12 + i * 0.08)) / 0.18;
      if (u < 0 || u > 1) continue;
      for (const offset of [-1, 0, 1]) {
        const hit = project(offset * 54, offset ? 10 : 0);
        const points: Point[] = [source, hit, focus, [0, -17]];
        let segment = 0,
          f = u / 0.57;
        if (u > 0.57) {
          segment = 1;
          f = (u - 0.57) / 0.28;
        }
        if (u > 0.85) {
          segment = 2;
          f = (u - 0.85) / 0.15;
        }
        const start = points[segment],
          end = points[segment + 1];
        const x = mix(start[0], end[0], f),
          y = mix(start[1], end[1], f);
        c.save();
        c.globalAlpha = 0.35;
        this.line([start, [x, y]], '#87d3ee', 1);
        c.restore();
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
        c.save();
        c.translate(x, y);
        c.rotate(angle);
        c.strokeStyle = '#b4efff';
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(-5, 0, 8, -0.8, 0.8);
        c.stroke();
        c.restore();
        this.glow(x, y, 6, '#9cecff55');
        if (u > 0.54 && u < 0.64) this.glow(...hit, 10, '#b8efff88');
      }
      if (u > 0.9) this.glow(0, -17, 11, '#e4fbffbb');
    }
    c.restore();
  }

  private cameraBody(door: number): void {
    const c = this.ctx;
    this.rect(-95, -65, 168, 104, '#131b26', 9);
    const metal = c.createLinearGradient(0, -65, 0, 39);
    metal.addColorStop(0, '#c2cad0');
    metal.addColorStop(0.15, '#718393');
    metal.addColorStop(0.9, '#263240');
    metal.addColorStop(1, '#8292a0');
    c.fillStyle = metal;
    c.beginPath();
    c.roundRect(-95, -65, 168, 104, 9);
    c.fill();
    this.rect(-90, -43, 158, 73, '#17202a', 4);
    for (let i = 0; i < 30; i++)
      this.line(
        [
          [-87 + i * 5, -40],
          [-87 + i * 5, 26],
        ],
        '#263340',
        0.6,
      );
    this.rect(-79, -76, 29, 12, '#b7c1ca', 3);
    this.rect(29, -75, 28, 10, '#7d8e9d', 3);
    this.rect(-24, -70, 37, 21, '#202c37', 3);
    this.rect(-17, -66, 23, 10, '#7390a3', 2);
    if (door > 0) {
      this.rect(-74, -38, 125, 64, '#080d14', 3);
      this.rect(-31, -29, 51, 45, '#171e29', 1);
      this.line(
        [
          [-31, -30],
          [20, -30],
          [20, 17],
          [-31, 17],
          [-31, -30],
        ],
        '#596978',
      );
      this.rect(-65, -31, 19, 52, '#8996a0', 3);
      this.rect(31, -31, 13, 52, '#657481', 2);
      // The back swings around its left hinge; the spool remains visible inside.
      c.save();
      c.translate(-85, -39);
      c.transform(Math.cos(door * Math.PI * 0.82), -0.22 * Math.sin(door * Math.PI), 0, 1, 0, 0);
      this.rect(0, 0, 145, 69, '#202b37', 4);
      this.line(
        [
          [7, 6],
          [138, 6],
          [138, 62],
          [7, 62],
          [7, 6],
        ],
        '#627282',
      );
      c.restore();
    } else {
      this.rect(-54, -36, 84, 61, '#0d141e', 3);
      this.frame(-50, -32, 76, 53, false);
      this.line(
        [
          [-43, -25],
          [-34, -25],
        ],
        '#d3e1eb',
      );
      this.line(
        [
          [-43, -25],
          [-43, -16],
        ],
        '#d3e1eb',
      );
    }
  }

  private film(x: number, y: number, state: 'blank' | 'negative' | 'scan', scan = 0): void {
    const c = this.ctx;
    this.rect(x - 100, y - 31, 201, 62, '#30241e', 2);
    for (let i = 0; i < 21; i++) {
      this.rect(x - 96 + i * 9.3, y - 27, 4.5, 5, '#d8c1a0', 1);
      this.rect(x - 96 + i * 9.3, y + 22, 4.5, 5, '#d8c1a0', 1);
    }
    for (let i = 0; i < 3; i++) {
      const fx = x - 89 + i * 62;
      this.rect(fx, y - 19, 54, 38, '#62503a');
      if (state !== 'blank') this.frame(fx, y - 19, 54, 38, true);
      if (state === 'scan') {
        c.save();
        c.beginPath();
        c.rect(x - 100, y - 21, scan * 200, 42);
        c.clip();
        this.frame(fx, y - 19, 54, 38, false);
        c.restore();
      }
    }
    // Metal cassette and protruding spool shaft travel with the film.
    this.rect(x + 99, y - 36, 25, 72, '#151e28', 5);
    this.rect(x + 102, y - 30, 19, 61, '#b9a474', 3);
    this.rect(x + 106, y - 42, 10, 7, '#b5bec8', 1);
    this.rect(x + 106, y + 36, 10, 7, '#b5bec8', 1);
    this.line(
      [
        [x + 101, y - 25],
        [x + 122, y - 25],
      ],
      '#e6d9b9',
    );
    if (state === 'scan') {
      this.glow(x - 100 + scan * 200, y, 29, '#9bdcdb55');
      this.line(
        [
          [x - 100 + scan * 200, y - 30],
          [x - 100 + scan * 200, y + 30],
        ],
        '#e0ffff',
        1.5,
      );
    }
  }

  private camera(t: number): void {
    const c = this.ctx;
    const exitDistance = this.height / (2 * this.scale) + 260;
    if (t < 0.42) {
      const fall = clamp((t - 0.28) / 0.14);
      c.save();
      c.translate(42 - 30 * fall, exitDistance * fall * fall);
      c.rotate(-0.28 * fall);

      this.cameraBody(ease((t - 0.11) / 0.09));
      if (t > 0.075 && t < 0.12) {
        const close = Math.sin(clamp((t - 0.075) / 0.045) * Math.PI);
        this.rect(-50, -32, 76, 53 * close, '#060a12');
      }
      c.restore();
    }
    // A blank cassette is pulled through the open back, and its leader unrolls.
    if (t >= 0.17 && t < 0.34) {
      const pull = ease((t - 0.17) / 0.13);
      c.save();
      c.translate(mix(78, 0, pull), mix(-7, -51, pull));
      c.scale(mix(0.18, 1, pull), mix(0.75, 1, pull));
      this.film(0, 0, 'blank');
      c.restore();
    }
    const tankVisible = t >= 0.29 && t < 0.8;
    const tankFall = clamp((t - 0.7) / 0.1);
    const tankOffset = exitDistance * (1 - ease((t - 0.29) / 0.06) + tankFall * tankFall);
    if (tankVisible) {
      c.save();
      c.translate(0, tankOffset);
      c.rotate(0.12 * tankFall);
      this.rect(-116, 39, 254, 102, '#293444', 7);
      c.fillStyle = '#101925';
      c.beginPath();
      c.ellipse(11, 39, 127, 17, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#5d6b7a';
      c.beginPath();
      c.ellipse(11, 39, 116, 12, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    if (t >= 0.34) {
      const dip = ease((t - 0.35) / 0.12),
        lift = ease((t - 0.55) / 0.14);
      const y = mix(-51, 91, dip) - lift * 142;
      this.film(0, y, t < 0.55 ? 'blank' : t < 0.72 ? 'negative' : 'scan', ease((t - 0.72) / 0.12));
      if (tankVisible) {
        c.save();
        c.translate(0, tankOffset);
        c.rotate(0.12 * tankFall);
        const tank = c.createLinearGradient(-116, 0, 138, 0);
        tank.addColorStop(0, '#536273');
        tank.addColorStop(0.35, '#9da8af');
        tank.addColorStop(0.75, '#667584');
        tank.addColorStop(1, '#3c4a5a');
        c.fillStyle = tank;
        c.beginPath();
        c.roundRect(-116, 43, 254, 98, [0, 0, 8, 8]);
        c.fill();
        this.line(
          [
            [-115, 44],
            [137, 44],
          ],
          '#c2ccd4',
          2,
        );
        this.rect(-79, 69, 180, 38, '#27333f', 3);
        this.line(
          [
            [-62, 84],
            [83, 84],
          ],
          '#576879',
        );
        this.line(
          [
            [-62, 93],
            [32, 93],
          ],
          '#576879',
        );
        this.rect(-124, 63, 8, 37, '#8695a4', 3);
        this.rect(138, 63, 8, 37, '#8695a4', 3);
        c.restore();
      }
    }
  }

  private frame(x: number, y: number, w: number, h: number, negative: boolean): void {
    const c = this.ctx;
    c.save();
    c.filter = negative ? 'invert(1) sepia(.85) brightness(.7)' : 'none';
    if (this.home) c.drawImage(this.home, x, y, w, h);
    else this.rect(x, y, w, h, '#182433');
    c.restore();
  }
  private zoomFrame(t: number): void {
    if (t <= 0.97) return;
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = '#000';
    c.globalAlpha = ease((t - 0.97) / 0.03);
    c.fillRect(0, 0, this.width, this.height);
    c.restore();
  }

  private rocket(t: number): void {
    const c = this.ctx;
    this.line(
      [
        [-145, 133],
        [145, 133],
      ],
      '#35445a',
    );
    // Stationary gantry, service platforms and umbilical.
    this.rect(58, -90, 9, 220, '#64778b', 1);
    this.rect(91, -90, 7, 220, '#37495f', 1);
    for (let i = 0; i < 11; i++)
      this.line(
        [
          [62, -87 + i * 20],
          [94, -67 + i * 20],
          [62, -67 + i * 20],
        ],
        '#74889b',
        1,
      );
    for (let i = 0; i < 5; i++)
      this.line(
        [
          [50, -65 + i * 42],
          [101, -65 + i * 42],
        ],
        '#a2afbd',
        2,
      );
    if (t < 0.59)
      this.line(
        [
          [65, -42],
          [25 + ease((t - 0.53) / 0.06) * 40, -42],
        ],
        '#b6c4ce',
        3,
      );
    const rollout = (1 - ease(t / 0.19)) * 290;
    const lift = Math.pow(clamp((t - 0.58) / 0.22), 2) * 420;
    c.save();
    c.translate(rollout, 75 - lift);
    c.rotate(((1 - ease((t - 0.2) / 0.17)) * Math.PI) / 2);
    const body = c.createLinearGradient(-13, 0, 13, 0);
    body.addColorStop(0, '#8194a5');
    body.addColorStop(0.3, '#eef1ee');
    body.addColorStop(0.65, '#c9d4d9');
    body.addColorStop(1, '#667e91');
    c.fillStyle = body;
    c.beginPath();
    c.moveTo(-13, 25);
    c.lineTo(-13, -100);
    c.quadraticCurveTo(-11, -122, 0, -138);
    c.quadraticCurveTo(11, -122, 13, -100);
    c.lineTo(13, 25);
    c.closePath();
    c.fill();
    for (const y of [-97, -70, -29, 17])
      this.line(
        [
          [-13, y],
          [13, y],
        ],
        '#5c7084',
        1.2,
      );
    this.rect(-13, -67, 26, 9, '#334860');
    this.polygon(
      [
        [-13, 1],
        [-26, 25],
        [-26, 34],
        [-13, 22],
      ],
      '#8ba0b0',
    );
    this.polygon(
      [
        [13, 1],
        [26, 25],
        [26, 34],
        [13, 22],
      ],
      '#617b91',
    );
    this.polygon(
      [
        [-10, 25],
        [-8, 32],
        [8, 32],
        [10, 25],
      ],
      '#334353',
    );
    this.rect(-3, -116, 6, 9, '#55758f', 2);
    if (t > 0.39 && t < 0.58) {
      const fade = ease((t - 0.39) / 0.04) * (1 - ease((t - 0.54) / 0.04));
      c.save();
      c.globalAlpha = fade;
      this.line(
        [
          [14, -8],
          [42, -8],
          [42, 45],
        ],
        '#7faab8',
        2,
      );
      for (let i = 0; i < 12; i++) {
        const p = (t * 4 + i / 12) % 1;
        this.glow(21 + p * 34, -8 - p * 17, 4 + p * 7, `rgba(205,224,231,${(1 - p) * 0.32})`);
      }
      c.restore();
    }
    if (t > 0.55) {
      const thrust = ease((t - 0.55) / 0.06);
      const flame = c.createLinearGradient(0, 30, 0, 130);
      flame.addColorStop(0, '#fffbea');
      flame.addColorStop(0.25, '#ffe1a0');
      flame.addColorStop(0.65, '#d8864680');
      flame.addColorStop(1, 'transparent');
      c.fillStyle = flame;
      c.beginPath();
      c.moveTo(-9, 30);
      c.quadraticCurveTo(-20, 62, 0, 32 + 110 * thrust);
      c.quadraticCurveTo(20, 62, 9, 30);
      c.fill();
      this.glow(0, 39, 30 * thrust, '#ffca6e55');
    }
    c.restore();
    if (t < 0.4) {
      c.save();
      const fall = clamp((t - 0.26) / 0.14);
      c.translate(0, (this.height / (2 * this.scale) + 180) * fall * fall);
      this.rect(rollout - 43, 106, 175, 10, '#61758b', 2);
      for (let i = 0; i < 5; i++) {
        c.fillStyle = '#202d3e';
        this.circle(rollout - 25 + i * 32, 123, 9);
        c.fillStyle = '#8293a3';
        this.circle(rollout - 25 + i * 32, 123, 4);
      }
      c.restore();
    }
  }

  private plume(t: number): void {
    if (t < 0.58) return;
    const c = this.ctx,
      w = this.width,
      h = this.height,
      age = clamp((t - 0.58) / 0.25);
    const radius = Math.hypot(w, h) * Math.pow(age, 1.6);
    const cx = w / 2,
      cy = h / 2 + 110 * this.scale;
    // Overlapping billows expand beyond every viewport edge before dissolving.
    c.fillStyle = '#b8c2ca';
    this.circle(cx, cy, radius * 0.8);
    for (let i = 0; i < 55; i++) {
      const a = i * 2.399,
        ring = 0.35 + (i % 7) / 10;
      const x = cx + Math.cos(a) * radius * ring,
        y = cy + Math.sin(a) * radius * ring;
      const r = radius * (0.16 + (i % 4) * 0.025);
      if (r <= 0) continue;
      const g = c.createRadialGradient(x - r * 0.25, y - r * 0.3, 0, x, y, r);
      g.addColorStop(0, i % 2 ? '#e1e5e7' : '#bdc8cf');
      g.addColorStop(0.75, '#acbac5');
      g.addColorStop(1, '#8298aa00');
      c.fillStyle = g;
      this.circle(x, y, r);
    }
  }

  private starPosition(t: number, side: number): Point {
    const u = clamp(t / 0.65),
      entry = this.width / (2 * this.scale) + 40;
    const r = entry * Math.pow(1 - u, 3) + 70 * Math.sin(Math.PI * u) * (1 - u);
    const a = 0.1 + u * 2 + u * u * u * 24 + side * Math.PI;
    return [Math.cos(a) * r, Math.sin(a) * r * 0.64];
  }
  private merger(t: number): void {
    if (t >= 0.65) return;
    const c = this.ctx;
    for (let side = 0; side < 2; side++) {
      const [x, y] = this.starPosition(t, side);
      const tail: Point[] = [];
      for (let j = 24; j >= 0; j--) tail.push(this.starPosition(Math.max(0, t - j * 0.002), side));
      this.line(tail, side ? '#b899c42e' : '#8dcce52e', 5);
      this.line(tail, side ? '#d5b9de99' : '#a7dff599', 1.4);
      this.glow(x, y, 24, side ? '#cfb8f080' : '#a4ddff80');
      c.fillStyle = side ? '#eadbff' : '#c4eeff';
      this.circle(x, y, 5.5);
      c.fillStyle = '#ffffff';
      this.circle(x - 1, y - 1, 2.5);
    }
  }
  private explosion(t: number): void {
    if (t < 0.65) return;
    const c = this.ctx,
      w = this.width,
      h = this.height;
    const growth = ease((t - 0.65) / 0.18),
      r = Math.hypot(w, h) * growth;
    if (r <= 0) return;
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.48, '#fffdf5');
    g.addColorStop(0.72, '#e6ddff');
    g.addColorStop(0.9, '#aa9bd4aa');
    g.addColorStop(1, 'transparent');
    c.fillStyle = g;
    this.circle(w / 2, h / 2, r);
    if (t < 0.81)
      for (let i = 0; i < 65; i++) {
        const a = i * 2.399,
          dist = growth * Math.hypot(w, h) * (0.18 + (i % 9) * 0.06);
        this.line(
          [
            [w / 2 + Math.cos(a) * dist * 0.8, h / 2 + Math.sin(a) * dist * 0.8],
            [w / 2 + Math.cos(a) * dist, h / 2 + Math.sin(a) * dist],
          ],
          '#f5edff99',
          1.3,
        );
      }
  }

  private dissolve(progress: number, protectScene = false, finish = 0): void {
    if (progress <= 0 && finish <= 0) return;
    const c = this.ctx,
      w = this.width,
      h = this.height,
      size = 24;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = '#000';
    for (let y = 0; y < h; y += size)
      for (let x = 0; x < w; x += size) {
        const hash = ((x * 73 + y * 137 + x * y * 19) % 997) / 997;
        const inScene =
          protectScene &&
          Math.abs(x - w / 2) < 115 * this.scale &&
          Math.abs(y - h / 2) < 190 * this.scale;
        const p = inScene ? finish : Math.max(progress, finish);
        c.globalAlpha = ease((p - hash * 0.76) / 0.24);
        // Align tile boundaries with the backing pixel grid, avoiding seams
        // when a narrow viewport uses a fractional canvas-to-CSS ratio.
        const rx = this.canvas.width / w,
          ry = this.canvas.height / h;
        const left = Math.round(x * rx) / rx,
          top = Math.round(y * ry) / ry;
        c.fillRect(
          left,
          top,
          Math.round((x + size) * rx) / rx - left,
          Math.round((y + size) * ry) / ry - top,
        );
      }
    c.restore();
  }

  /** Compose the existing homepage geometry into the film frames, so the zoom
   * lands on the actual layout rather than an unrelated placeholder image. */
  private captureHome(): HTMLCanvasElement | null {
    const field = document.querySelector<HTMLCanvasElement>('app-deep-field canvas');
    const portrait = document.querySelector<HTMLImageElement>('.portrait-frame img');
    if (!field?.width || !portrait?.complete || !portrait.naturalWidth) return null;
    const result = document.createElement('canvas');
    result.width = this.width;
    result.height = this.height;
    const c = result.getContext('2d')!;
    c.fillStyle = '#070a16';
    c.fillRect(0, 0, this.width, this.height);
    const rect = field.getBoundingClientRect();
    const ratio = Math.max(rect.width / field.width, rect.height / field.height);
    c.globalAlpha = 0.8;
    c.drawImage(
      field,
      rect.x + (rect.width - field.width * ratio) / 2,
      rect.y + (rect.height - field.height * ratio) / 2,
      field.width * ratio,
      field.height * ratio,
    );
    c.globalAlpha = 1;
    const shade = c.createRadialGradient(
      this.width / 2,
      this.height * 0.48,
      20,
      this.width / 2,
      this.height * 0.48,
      Math.max(this.width, this.height) * 0.65,
    );
    shade.addColorStop(0, '#070a1620');
    shade.addColorStop(1, '#070a16b0');
    c.fillStyle = shade;
    c.fillRect(0, 0, this.width, this.height);
    const orbit = document.querySelector('.orbit-lines')?.getBoundingClientRect();
    if (orbit) {
      c.strokeStyle = '#8d9dbb30';
      c.setLineDash([2, 7]);
      c.beginPath();
      c.ellipse(
        orbit.x + orbit.width / 2,
        orbit.y + orbit.height / 2,
        orbit.width * 0.36,
        orbit.height * 0.36,
        0,
        0,
        Math.PI * 2,
      );
      c.stroke();
      c.setLineDash([]);
    }
    const p = portrait.getBoundingClientRect();
    c.save();
    c.beginPath();
    c.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
    c.clip();
    const crop = Math.min(portrait.naturalWidth, portrait.naturalHeight);
    c.drawImage(
      portrait,
      (portrait.naturalWidth - crop) / 2,
      (portrait.naturalHeight - crop) / 2,
      crop,
      crop,
      p.x,
      p.y,
      p.width,
      p.height,
    );
    c.restore();
    for (const bubble of document.querySelectorAll<HTMLElement>('.satellite-bubble')) {
      const r = bubble.getBoundingClientRect();
      const style = getComputedStyle(bubble);
      c.fillStyle = style.backgroundColor;
      c.strokeStyle = style.borderColor;
      c.beginPath();
      c.arc(r.x + r.width / 2, r.y + r.height / 2, r.width / 2, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      const svg = bubble.querySelector('svg');
      if (svg) {
        const sr = svg.getBoundingClientRect();
        c.fillStyle = style.color;
        for (const pixel of svg.querySelectorAll('rect'))
          c.fillRect(
            sr.x + (Number(pixel.getAttribute('x')) * sr.width) / 12,
            sr.y + (Number(pixel.getAttribute('y')) * sr.height) / 12,
            sr.width / 12,
            sr.height / 12,
          );
      }
    }
    const selectors = [
      '.home-wordmark',
      '.small-label',
      '.universe-intro p',
      '.portrait-hub h1',
      '.portrait-hub > p',
      '.satellite-label',
      '.orbit-caption p',
      '.personal-links a',
      '.personal-links button',
      '.home-colophon > span',
      '.home-colophon button',
    ];
    c.textBaseline = 'middle';
    for (const element of document.querySelectorAll<HTMLElement>(selectors.join(','))) {
      const r = element.getBoundingClientRect(),
        s = getComputedStyle(element);
      const text = Array.from(element.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join('')
        .trim();
      c.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      c.fillStyle = s.color;
      c.textAlign = s.textAlign === 'center' ? 'center' : 'left';
      c.fillText(text, c.textAlign === 'center' ? r.x + r.width / 2 : r.x, r.y + r.height / 2);
    }
    return result;
  }
}
