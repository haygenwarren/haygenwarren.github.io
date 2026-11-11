import { Painter, Point, Scene, clamp, hash, keyframes, mix, smooth, span } from '../pixel-painter';

// Scene geometry, in scene units. The dish rotates about PIVOT (its elevation
// axis); everything inside the dish is drawn in that rotated, local frame.
const LIFT = 26; // shifts the whole picture down so sky and ground balance
const PIVOT: Point = [0, -4];
const LOCK = -0.36; // pointing angle of the source
const SOURCE_DISTANCE = 190;
const VERTEX = -10;
const FOCAL = 60;
const APERTURE = 86;
const HORN: Point = [0, -68]; // feed horn mouth, at the focus
const surface = (x: number) => VERTEX - (x * x) / (4 * FOCAL);
/** Back face of the dish: thickest at the centre, thinner at the rim. */
const backing = (x: number) => 2 - (1.1 * x * x) / (4 * FOCAL);

// Scan right, sweep back past the source (a blip), overshoot, settle on it.
const SWEEP: [number, number][] = [
  [0, 0.12],
  [0.07, 0.12],
  [0.16, 0.62],
  [0.27, -0.64],
  [0.33, -0.27],
  [0.37, -0.4],
  [0.41, LOCK],
];
const LOCKED = 0.41;
const PACKETS = 6;
const FIRST = 0.43;
const GAP = 0.062;
const TRAVEL = 0.13;
const TILE = 4; // art pixels per revealed "bit"

const rotate = ([x, y]: Point, a: number): Point => [
  x * Math.cos(a) - y * Math.sin(a),
  x * Math.sin(a) + y * Math.cos(a),
];
const toWorld = (local: Point, angle: number): Point => {
  const [x, y] = rotate(local, angle);
  return [PIVOT[0] + x, PIVOT[1] + y];
};
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

interface Ray {
  hit: Point;
  incoming: number;
  reflected: number;
}

/** A radio dish scans the sky, locks onto a source, and every wave it
 * focuses into the receiver reveals more of the page, bit by bit. */
export class TelescopeScene implements Scene {
  private source = toWorld([0, -SOURCE_DISTANCE], LOCK);
  private rays: Ray[] = [];
  private longest = 0;
  private thresholds: Float32Array;
  private tilesX: number;
  private tilesY: number;

  constructor(private p: Painter) {
    const localSource: Point = [0, -SOURCE_DISTANCE];
    for (let i = 0; i <= 12; i++) {
      const x = mix(-80, 80, i / 12);
      const hit: Point = [x, surface(x)];
      const ray = {
        hit,
        incoming: distance(localSource, hit),
        reflected: distance(hit, HORN),
      };
      this.rays.push(ray);
      this.longest = Math.max(this.longest, ray.incoming + ray.reflected);
    }
    // Bits nearest the receiver arrive first, with noise so the page fills in
    // like a picture being decoded rather than a clean wipe.
    const [hx, hy] = toWorld(HORN, LOCK);
    const rx = p.w / 2 + hx * p.scale,
      ry = p.h / 2 + (hy + LIFT) * p.scale;
    const far = Math.max(
      Math.hypot(rx, ry),
      Math.hypot(p.w - rx, ry),
      Math.hypot(rx, p.h - ry),
      Math.hypot(p.w - rx, p.h - ry),
    );
    this.tilesX = Math.ceil(p.cols / TILE);
    this.tilesY = Math.ceil(p.rows / TILE);
    this.thresholds = new Float32Array(this.tilesX * this.tilesY);
    for (let y = 0; y < this.tilesY; y++)
      for (let x = 0; x < this.tilesX; x++) {
        const cx = (x + 0.5) * TILE * p.px,
          cy = (y + 0.5) * TILE * p.px;
        const near = Math.hypot(cx - rx, cy - ry) / far;
        this.thresholds[y * this.tilesX + x] = 0.7 * near + 0.3 * hash(x, y, 7);
      }
  }

  draw(t: number, seconds: number): void {
    const p = this.p;
    p.backdrop(seconds);
    this.reveal(t);
    const angle = keyframes(SWEEP, t);
    const blip = t < 0.3 ? clamp(1 - Math.abs(angle - LOCK) / 0.05) : 0;
    p.scene();
    p.ctx.translate(0, LIFT);
    p.alpha(1 - smooth(span(t, 0.87, 0.98)), () => {
      this.ground();
      p.save(() => {
        p.ctx.translate(...PIVOT);
        p.ctx.rotate(angle);
        this.beam(t, blip);
      });
      this.star(t, seconds, blip);
      this.mount();
      p.save(() => {
        p.ctx.translate(...PIVOT);
        p.ctx.rotate(angle);
        this.dish(t, seconds, blip);
        if (t >= LOCKED) this.waves(t);
      });
    });
  }

  private launch(i: number): number {
    return FIRST + i * GAP;
  }
  private received(i: number): number {
    return this.launch(i) + TRAVEL;
  }

  private reveal(t: number): void {
    let level = smooth(span(t, 0.86, 0.97)) * 0.12;
    for (let i = 0; i < PACKETS; i++) level += smooth((t - this.received(i)) / 0.05) / PACKETS;
    if (level <= 0) return;
    const p = this.p,
      c = p.ctx;
    p.grid();
    c.fillStyle = '#8fe6ff';
    for (let y = 0; y < this.tilesY; y++)
      for (let x = 0; x < this.tilesX; x++) {
        const threshold = this.thresholds[y * this.tilesX + x];
        if (level <= threshold) continue;
        c.clearRect(x * TILE, y * TILE, TILE, TILE);
        // A freshly decoded bit glows briefly before the page settles in.
        const age = (level - threshold) / 0.045;
        if (age < 1) {
          c.globalAlpha = (1 - age) * 0.6;
          c.fillRect(x * TILE, y * TILE, TILE, TILE);
          c.globalAlpha = 1;
        }
      }
  }

  private ground(): void {
    const p = this.p,
      u = p.unit;
    p.rect(-p.halfWidth, 121, p.halfWidth * 2, u, '#1d2741');
    for (let i = 0; i < 18; i++) {
      const x = mix(-p.halfWidth, p.halfWidth, hash(i, 31));
      p.rect(x, 121 + u * (1 + Math.floor(hash(i, 32) * 3)), u * 2, u, '#141b2e');
    }
  }

  /** A faint wedge along the pointing axis makes the search legible. */
  private beam(t: number, blip: number): void {
    const strength = (1 - smooth(span(t, 0.42, 0.5))) * (0.08 + blip * 0.08);
    this.p.alpha(strength, () =>
      this.p.poly(
        [
          [-3, HORN[1]],
          [3, HORN[1]],
          [26, -360],
          [-26, -360],
        ],
        '#86c2ee',
      ),
    );
  }

  private star(t: number, seconds: number, blip: number): void {
    const p = this.p,
      u = p.unit;
    const [x, y] = this.source;
    let strength = 0.45 + 0.12 * Math.sin(seconds * 3) + blip * 0.9;
    if (t >= LOCKED) strength = 0.9 + 0.1 * Math.sin(seconds * 9);
    for (let i = 0; i < PACKETS; i++) {
      const age = (t - this.launch(i)) / 0.07;
      if (age < 0 || age > 1) continue;
      strength += (1 - age) * 0.6;
      p.alpha(1 - age, () => p.ring(x, y, mix(5, 36, age), '#a6ecff', u));
    }
    strength *= 1 - smooth(span(t, 0.84, 0.92));
    p.glow(x, y, 18, '#9fe3ff', strength);
    p.alpha(clamp(strength + 0.3), () => {
      p.rect(x - u * 2, y - u / 2, u * 4, u, '#cfefff');
      p.rect(x - u / 2, y - u * 2, u, u * 4, '#cfefff');
      p.circle(x, y, 2.2, '#f2fbff');
    });
  }

  private mount(): void {
    const p = this.p;
    p.rect(-44, 113, 88, 8, '#56677d');
    p.rect(-44, 113, 88, 2, '#7a8ba0');
    p.poly(
      [
        [-26, 113],
        [26, 113],
        [14, 30],
        [-14, 30],
      ],
      '#8796aa',
    );
    p.poly(
      [
        [-26, 113],
        [-9, 113],
        [-4, 30],
        [-14, 30],
      ],
      '#afbccb',
    );
    p.rect(-5, 95, 10, 18, '#33425a');
    p.rect(-24, 19, 48, 13, '#c3ccd6');
    p.rect(-24, 28, 48, 4, '#8796aa');
    p.rect(-34, -8, 8, 30, '#a9b6c4');
    p.rect(26, -8, 8, 30, '#8796aa');
    p.circle(-30, -4, 4.5, '#56677d');
    p.circle(30, -4, 4.5, '#56677d');
  }

  private dish(t: number, seconds: number, blip: number): void {
    const p = this.p,
      u = p.unit;
    const inner: Point[] = [],
      outer: Point[] = [];
    for (let x = -APERTURE; x <= APERTURE; x += 4) {
      inner.push([x, surface(x)]);
      outer.unshift([x, backing(x)]);
    }
    // Back truss converging on the elevation hub.
    for (const x of [-64, -34, 34, 64])
      p.line(
        [
          [x, backing(x)],
          [Math.sign(x) * 7, 5],
        ],
        '#5f6f85',
        u * 0.8,
      );
    p.rect(-12, -2, 24, 10, '#6c7c90');
    p.poly([...inner, ...outer], '#9eacbc');
    p.line(outer, '#5f6f85', u * 0.9);
    p.line(
      inner.map(([x, y]) => [x, y + 2.4] as Point),
      '#c8d2db',
      u,
    );
    p.line(inner, '#f0f3f5', u);
    for (const x of [-60, -30, 0, 30, 60])
      p.line(
        [
          [x, surface(x) + 3.5],
          [x, backing(x) - u * 0.5],
        ],
        '#7d8b9d',
        u * 0.6,
      );
    // Feed legs from the rim to the receiver at the focus.
    for (const side of [-1, 1])
      p.line(
        [
          [side * 80, surface(80)],
          [side * 5, -80],
        ],
        '#7f8c9c',
        u * 0.85,
      );
    p.poly(
      [
        [-5, -74],
        [5, -74],
        [3, HORN[1]],
        [-3, HORN[1]],
      ],
      '#8796aa',
    );
    p.rect(-8, -87, 16, 13, '#d3dae0');
    p.rect(2, -87, 6, 13, '#a9b6c4');

    let flash = 0;
    for (let i = 0; i < PACKETS; i++) {
      const age = t - this.received(i);
      if (age >= 0) flash = Math.max(flash, 1 - age / 0.05);
    }
    flash = clamp(flash);
    let led = Math.sin(seconds * 7) > 0 ? '#d9a35b' : '#6b5a44';
    if (t >= LOCKED) led = '#8fe6ff';
    if (blip > 0.3 || flash > 0.2) led = '#ffffff';
    p.rect(-6, -84, u, u, led);
    p.glow(...HORN, 16, '#b8f2ff', flash + blip * 0.6);
  }

  /** Wavefronts travel along real rays: source → reflector → feed. Fronts
   * that have reflected bend into arcs converging on the horn. */
  private waves(t: number): void {
    const p = this.p,
      u = p.unit;
    const localSource: Point = [0, -SOURCE_DISTANCE];
    for (let i = 0; i < PACKETS; i++) {
      const age = (t - this.launch(i)) / TRAVEL;
      if (age < 0 || age > 1) continue;
      const lead = age * this.longest;
      for (const [offset, color, width] of [
        [0, '#c8f5ff', u * 1.15],
        [11, '#5fbfe0', u],
      ] as const) {
        const travelled = lead - offset;
        if (travelled <= 0) continue;
        const front: Point[] = [];
        for (const ray of this.rays) {
          const { hit, incoming, reflected } = ray;
          if (travelled >= incoming + reflected) continue;
          if (travelled < incoming) {
            const f = travelled / incoming;
            front.push([mix(localSource[0], hit[0], f), mix(localSource[1], hit[1], f)]);
          } else {
            const f = (travelled - incoming) / reflected;
            front.push([mix(hit[0], HORN[0], f), mix(hit[1], HORN[1], f)]);
          }
        }
        if (front.length > 1) p.line(front, color, width);
      }
    }
  }
}
