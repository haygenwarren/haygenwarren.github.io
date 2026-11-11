import {
  Painter,
  Point,
  Scene,
  clamp,
  easeIn,
  easeOut,
  hash,
  mix,
  smooth,
  span,
} from '../pixel-painter';

const OFFSET = -16; // vertical centring of the launch site
const BASE_Y = 92; // rocket base (engine mount) when standing on the pad
const LENGTH = 178;
const ROLLED_IN = 0.18;
const RAISED: [number, number] = [0.2, 0.35];
const FUELING: [number, number] = [0.37, 0.53];
const RETRACT: [number, number] = [0.54, 0.58];
const IGNITION = 0.565;
const LIFTOFF = 0.6;
const COVERED = 0.83; // smoke fills the screen; the night sky can go
const CLEARING = 0.84;

interface Billow {
  spawn: number;
  life: number;
  from: Point;
  to: Point;
  r0: number;
  r1: number;
  seed: number;
}

/** A rocket is rolled out, raised, fuelled and launched; its exhaust fills
 * the screen and clears to reveal the page. */
export class RocketScene implements Scene {
  private billows: Billow[] = [];
  private pipe: Point[] = [
    [-128, 97],
    [-128, 117],
    [-27, 117],
    [-27, 79],
  ];

  constructor(private p: Painter) {
    const { w, h, scale } = p;
    const big = Math.max(w, h);
    const pad = this.toScreen([0, 112]);
    // Fill: a jittered grid whose cells are guaranteed to be covered, each
    // appearing once the cloud has rolled out that far from the pad.
    const cell = big / 5.5;
    const far = Math.max(Math.hypot(pad[0], pad[1]), Math.hypot(w - pad[0], pad[1]));
    let n = 0;
    for (let gy = -0.5; gy * cell < h + cell; gy++)
      for (let gx = -0.5; gx * cell < w + cell; gx++, n++) {
        const x = gx * cell + (hash(n, 11) - 0.5) * cell * 0.2,
          y = gy * cell + (hash(n, 12) - 0.5) * cell * 0.2;
        const r = cell * (1 + 0.15 * hash(n, 13));
        this.billows.push({
          spawn: 0.63 + 0.12 * clamp(Math.hypot(x - pad[0], y - pad[1]) / far),
          life: 0.07,
          from: [mix(pad[0], x, 0.6), mix(pad[1], y, 0.6)],
          to: [x, y],
          r0: r * 0.3,
          r1: r,
          seed: n,
        });
      }
    // Ground cloud: billows pushed sideways out of the flame trench.
    for (let i = 0; i < 60; i++, n++) {
      const side = i % 2 ? 1 : -1;
      const from: Point = [pad[0] + side * 20 * scale, pad[1]];
      this.billows.push({
        spawn: IGNITION + 0.01 + 0.17 * hash(i, 1),
        life: 0.2 + 0.08 * hash(i, 5),
        from,
        to: [
          from[0] + side * (0.12 + 0.88 * hash(i, 2)) * w * 0.6,
          from[1] - (0.02 + hash(i, 3) * 0.35) * h,
        ],
        r0: 6 * scale,
        r1: (0.06 + 0.1 * hash(i, 4)) * big,
        seed: n,
      });
    }
    // Exhaust column left behind the climbing rocket.
    for (let i = 0; i < 24; i++, n++) {
      const spawn = LIFTOFF + i * 0.008;
      const [x, y] = this.toScreen([(hash(i, 21) - 0.5) * 36, BASE_Y + 10 - this.lift(spawn)]);
      if (y < -60 * scale) break;
      this.billows.push({
        spawn,
        life: 0.2,
        from: [x, y],
        to: [x + (hash(i, 22) - 0.5) * 90 * scale, y + 20 * scale],
        r0: 10 * scale,
        r1: (30 + 40 * hash(i, 23)) * scale,
        seed: n,
      });
    }
  }

  private toScreen([x, y]: Point): Point {
    return [this.p.w / 2 + x * this.p.scale, this.p.h / 2 + (y + OFFSET) * this.p.scale];
  }
  private lift(t: number): number {
    return (this.p.h / this.p.scale + 320) * easeIn(span(t, LIFTOFF, 0.76));
  }

  draw(t: number, seconds: number): void {
    const p = this.p,
      c = p.ctx;
    if (t < COVERED) {
      p.backdrop(seconds);
      p.scene();
      c.translate(0, OFFSET);
      this.site(t, seconds);
    } else {
      p.grid();
      c.clearRect(0, 0, p.cols, p.rows);
    }
    p.screen();
    for (const billow of this.billows) this.billow(billow, t);
  }

  private site(t: number, seconds: number): void {
    const p = this.p,
      c = p.ctx,
      u = p.unit;
    const baseX = mix(p.halfWidth + 30, 0, easeOut(span(t, 0, ROLLED_IN)));
    const angle = (Math.PI / 2) * (1 - smooth(span(t, ...RAISED)));

    p.rect(-p.halfWidth, 120, p.halfWidth * 2, u, '#1d2741');
    this.fuelFarm(t, seconds);
    // Launch table over the flame trench.
    p.rect(-19, 107, 38, 13, '#0b1018');
    p.rect(-28, 107, 9, 13, '#4f5f72');
    p.rect(19, 107, 9, 13, '#4f5f72');
    p.rect(-30, 100, 60, 7, '#6a7a8c');
    p.rect(-30, 100, 60, 1.5, '#8d9db0');

    this.transporter(baseX);
    // The strongback stays on the pad; it tilts away just before ignition.
    p.save(() => {
      c.translate(baseX, BASE_Y);
      c.rotate(angle);
      c.translate(16, 0);
      c.rotate(0.22 * smooth(span(t, ...RETRACT)));
      c.translate(-16, 0);
      this.strongback();
    });
    const shake = t > IGNITION && t < 0.63 ? (hash(Math.floor(seconds * 40)) - 0.5) * u : 0;
    p.save(() => {
      c.translate(baseX + shake, BASE_Y - this.lift(t));
      c.rotate(angle);
      if (t > IGNITION) this.flame(t, seconds);
      this.vehicle(t);
    });
    if (t > FUELING[0] - 0.02 && t < RETRACT[1]) this.vapor(t, seconds);
  }

  private fuelFarm(t: number, seconds: number): void {
    const p = this.p,
      u = p.unit;
    for (const x of [-140, -116]) p.rect(x, 90, 2.5, 30, '#4f5f72');
    p.circle(-128, 80, 17, '#aeb9c4');
    p.circle(-133, 75, 9, '#d4dce3');
    p.line(this.pipe, '#4f5f72', u * 1.2);
    // Tail service mast, with its arm swung to the rocket while fuelling.
    p.rect(-30, 66, 6, 54, '#55677b');
    const arm = span(t, 0.33, 0.36) * (1 - span(t, RETRACT[0], RETRACT[0] + 0.02));
    p.rect(-27, 76, mix(3, 16, arm), 4, '#7a8ca0');
    const flowing =
      span(t, FUELING[0], FUELING[0] + 0.01) * (1 - span(t, FUELING[1], FUELING[1] + 0.01));
    if (flowing <= 0) return;
    // Propellant pulses travelling along the line to the rocket.
    const lengths = this.pipe
      .slice(1)
      .map((pt, i) => Math.hypot(pt[0] - this.pipe[i][0], pt[1] - this.pipe[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    for (let d = (seconds * 70) % 9; d < total; d += 9) {
      let rest = d,
        k = 0;
      while (rest > lengths[k]) rest -= lengths[k++];
      const [x0, y0] = this.pipe[k],
        [x1, y1] = this.pipe[k + 1];
      const f = rest / lengths[k];
      p.alpha(flowing, () =>
        p.rect(mix(x0, x1, f) - u / 2, mix(y0, y1, f) - u / 2, u, u, '#cfe9ff'),
      );
    }
  }

  private transporter(baseX: number): void {
    const p = this.p,
      c = p.ctx,
      u = p.unit;
    p.rect(baseX + 6, 110, 196, 6, '#46566a');
    p.rect(baseX + 6, 110, 196, 1.5, '#6b7d92');
    p.rect(baseX + 6, 102, 14, 8, '#3e4d5f');
    p.rect(baseX + 196, 96, 24, 20, '#5d6f85');
    p.rect(baseX + 204, 99, 12, 7, '#a8c2d6');
    for (const offset of [36, 62, 150, 176]) {
      const x = baseX + offset;
      p.circle(x, 115, 5, '#1b2430');
      p.circle(x, 115, 2, '#7a8a9a');
      const spin = -baseX / 5;
      p.save(() => {
        c.translate(x, 115);
        c.rotate(spin);
        p.rect(-u / 2, -4.5, u, 3, '#7a8a9a');
      });
    }
  }

  private strongback(): void {
    const p = this.p,
      u = p.unit;
    p.rect(13, -160, 2.5, 160, '#56687d');
    p.rect(18, -160, 2.5, 160, '#56687d');
    const zigzag: Point[] = [];
    for (let y = 0, k = 0; y >= -160; y -= 12, k++) zigzag.push([k % 2 ? 19 : 14, y]);
    p.line(zigzag, '#7a8ca0', u * 0.7);
    p.rect(12, -163, 10, 3, '#7a8ca0');
    for (const y of [-128, -64]) p.rect(11, y, 9, 3, '#7a8ca0');
  }

  private vehicle(t: number): void {
    const p = this.p,
      u = p.unit;
    // Engine bell and fins.
    p.poly(
      [
        [-7, 0],
        [7, 0],
        [9, 8],
        [-9, 8],
      ],
      '#3c4b5b',
    );
    p.poly(
      [
        [-11, -30],
        [-22, -6],
        [-22, 4],
        [-11, -2],
      ],
      '#7c91a3',
    );
    p.poly(
      [
        [11, -30],
        [22, -6],
        [22, 4],
        [11, -2],
      ],
      '#5d7286',
    );
    // Body, with a lit left edge and shaded right third.
    p.rect(-11, -150, 22, 150, '#d3dbe1');
    p.rect(4, -150, 7, 150, '#a7b5c1');
    p.rect(-9, -150, 2.5, 150, '#f1f5f7');
    p.poly(
      [
        [-11, -150],
        [11, -150],
        [6, -166],
        [0, -LENGTH],
        [-6, -166],
      ],
      '#e4e9ed',
    );
    p.poly(
      [
        [4, -150],
        [11, -150],
        [6, -166],
        [0, -LENGTH],
      ],
      '#b5c2cc',
    );
    // Frost climbs the tanks as cryogenic propellant loads.
    const fill = smooth(span(t, ...FUELING)) * (1 - span(t, 0.62, 0.7));
    if (fill > 0) {
      const top = -4 - fill * 136;
      p.alpha(0.75, () => p.rect(-11, top, 22, -4 - top, '#f7fbff'));
      for (let k = 0; k < 40; k++) {
        const y = -4 - hash(k, 51) * 136;
        if (y > top) p.rect(-10 + hash(k, 52) * 19, y, u, u, '#a9d4ee');
      }
    }
    p.rect(-11, -100, 22, 7, '#2f4256');
    p.rect(-11, -40, 22, 4, '#2f4256');
    p.rect(-3, -126, 6, 8, '#2f4256');
  }

  private flame(t: number, seconds: number): void {
    const p = this.p;
    const thrust = smooth(span(t, IGNITION, LIFTOFF));
    const flicker = (k: number) => 1 + 0.14 * Math.sin(seconds * 47 + k * 2.1);
    p.glow(0, 24, 48 * thrust, '#ffbe6a', thrust);
    p.poly(
      [
        [-9, 8],
        [9, 8],
        [8, 8 + 24 * thrust * flicker(1)],
        [0, 8 + 74 * thrust * flicker(2)],
        [-8, 8 + 24 * thrust * flicker(3)],
      ],
      '#f08a42',
    );
    p.poly(
      [
        [-6, 8],
        [6, 8],
        [5, 8 + 18 * thrust],
        [0, 8 + 50 * thrust * flicker(4)],
        [-5, 8 + 18 * thrust],
      ],
      '#ffcf72',
    );
    p.poly(
      [
        [-3.5, 8],
        [3.5, 8],
        [0, 8 + 28 * thrust * flicker(5)],
      ],
      '#fff6d8',
    );
  }

  /** Boil-off venting from the tanks while fuelling. */
  private vapor(t: number, seconds: number): void {
    const p = this.p;
    const venting =
      span(t, FUELING[0] + 0.01, FUELING[0] + 0.05) * (1 - span(t, RETRACT[0], RETRACT[1]));
    for (const [vx, vy, dir] of [
      [-11, -97, -1],
      [11, -97, 1],
      [-11, -38, -1],
    ] as const)
      for (let k = 0; k < 9; k++) {
        const age = (seconds * 0.8 + k / 9 + hash(k, vy)) % 1;
        p.alpha((1 - age) * 0.9 * venting, () =>
          p.circle(vx + dir * (5 + age * 30), BASE_Y + vy + age * 22, 3 + age * 9, '#eef3f6'),
        );
      }
  }

  private billow(b: Billow, t: number): void {
    const age = (t - b.spawn) / b.life;
    if (age < 0) return;
    const p = this.p;
    // Smoke breaks up in patches, from the middle of the screen outward.
    const dx = b.to[0] - p.w / 2,
      dy = b.to[1] - p.h / 2,
      d = Math.hypot(dx, dy) || 1;
    const start =
      CLEARING + 0.1 * (0.6 * clamp(d / Math.hypot(p.w / 2, p.h / 2)) + 0.4 * hash(b.seed, 9));
    const clear = smooth(span(t, start, start + 0.05));
    if (clear >= 1) return;
    const grow = easeOut(age);
    let x = mix(b.from[0], b.to[0], grow),
      y = mix(b.from[1], b.to[1], grow);
    let r = mix(b.r0, b.r1, grow);
    // As it clears, each billow drifts outward and up, thinning and shrinking.
    x += (dx / d) * clear * 0.18 * Math.max(p.w, p.h);
    y -= clear * 0.06 * p.h;
    r *= 1 - clear * 0.4;
    p.alpha(1 - clear, () => {
      p.circle(x + r * 0.08, y + r * 0.12, r, '#8a97a4');
      p.circle(x, y, r * 0.93, '#bec8d0');
      p.circle(x - r * 0.24, y - r * 0.28, r * 0.55, '#dfe5e9');
    });
  }
}
