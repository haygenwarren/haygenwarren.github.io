import {
  Painter,
  Point,
  Scene,
  TAU,
  clamp,
  easeOut,
  hash,
  mix,
  smooth,
  span,
} from '../pixel-painter';

// Equal-mass stars under gravity plus a drag that only matters at close range,
// a stand-in for gravitational-wave losses. The first close pass captures
// them; every pass after that tightens the orbit until they touch.
const GRAVITY = 22.5e6;
const DRAG = 5.5e6;
const DRAG_POWER = 4;
const IMPACT = 83; // vertical offset of each star's incoming path
const SPEED = 150; // each star's incoming speed
const START = 400; // where the simulation begins; straight-line motion before
const CONTACT = 8;
const STEP = 0.0005;
const COLLIDE = 0.68; // animation progress at the moment of contact

interface Orbit {
  x: Float32Array;
  y: Float32Array;
  end: number;
  ripples: { time: number; strength: number }[];
}

let cached: Orbit | null = null;
/** Integrate the separation vector (star B − star A) with RK4. */
function simulate(): Orbit {
  if (cached) return cached;
  const xs: number[] = [],
    ys: number[] = [];
  let x = 2 * START,
    y = 2 * IMPACT,
    vx = -2 * SPEED,
    vy = 0;
  const force = (x: number, y: number, vx: number, vy: number): [number, number] => {
    const d = Math.hypot(x, y),
      g = -GRAVITY / (d * d * d),
      k = DRAG / Math.pow(d, DRAG_POWER);
    return [g * x - k * vx, g * y - k * vy];
  };
  while (xs.length < 60000) {
    xs.push(x);
    ys.push(y);
    if (Math.hypot(x, y) < CONTACT) break;
    const h = STEP;
    const [ax1, ay1] = force(x, y, vx, vy);
    const [ax2, ay2] = force(
      x + (vx * h) / 2,
      y + (vy * h) / 2,
      vx + (ax1 * h) / 2,
      vy + (ay1 * h) / 2,
    );
    const vx2 = vx + (ax1 * h) / 2,
      vy2 = vy + (ay1 * h) / 2;
    const [ax3, ay3] = force(
      x + (vx2 * h) / 2,
      y + (vy2 * h) / 2,
      vx + (ax2 * h) / 2,
      vy + (ay2 * h) / 2,
    );
    const vx3 = vx + (ax2 * h) / 2,
      vy3 = vy + (ay2 * h) / 2;
    const [ax4, ay4] = force(x + vx3 * h, y + vy3 * h, vx + ax3 * h, vy + ay3 * h);
    const vx4 = vx + ax3 * h,
      vy4 = vy + ay3 * h;
    x += (h / 6) * (vx + 2 * vx2 + 2 * vx3 + vx4);
    y += (h / 6) * (vy + 2 * vy2 + 2 * vy3 + vy4);
    vx += (h / 6) * (ax1 + 2 * ax2 + 2 * ax3 + ax4);
    vy += (h / 6) * (ay1 + 2 * ay2 + 2 * ay3 + ay4);
  }
  // A ripple leaves the pair every half orbit once they are bound, so the
  // rings bunch up (a chirp) as the orbit shrinks.
  const ripples: Orbit['ripples'] = [];
  let captured = false,
    unwrapped = 0,
    previous = Math.atan2(ys[0], xs[0]),
    captureAngle = 0,
    direction = 1,
    halfTurns = 1;
  for (let i = 1; i < xs.length; i++) {
    const d = Math.hypot(xs[i], ys[i]);
    let delta = Math.atan2(ys[i], xs[i]) - previous;
    if (delta > Math.PI) delta -= TAU;
    if (delta < -Math.PI) delta += TAU;
    previous += delta;
    unwrapped += delta;
    if (!captured && d > Math.hypot(xs[i - 1], ys[i - 1])) {
      captured = true;
      captureAngle = unwrapped;
      direction = Math.sign(delta) || 1;
    }
    if (captured && (unwrapped - captureAngle) * direction >= halfTurns * Math.PI) {
      ripples.push({ time: i * STEP, strength: clamp(60 / d) });
      halfTurns++;
    }
  }
  cached = {
    x: Float32Array.from(xs),
    y: Float32Array.from(ys),
    end: (xs.length - 1) * STEP,
    ripples,
  };
  return cached;
}

/** Two neutron stars fly in, fling past each other, spiral together faster
 * and faster, and collide; the blast wave uncovers the page. */
export class MergerScene implements Scene {
  private orbit = simulate();
  private begin: number;

  constructor(private p: Painter) {
    // Start each star just beyond the screen edge, whatever the screen width.
    const edge = p.halfWidth + 24;
    if (edge >= START) this.begin = -(edge - START) / SPEED;
    else {
      let i = 0;
      while (i < this.orbit.x.length - 1 && this.orbit.x[i] / 2 > edge) i++;
      this.begin = i * STEP;
    }
  }

  /** Separation vector at simulation time `time`. */
  private separation(time: number): Point {
    if (time < 0) return [2 * START - 2 * SPEED * time, 2 * IMPACT];
    const { x, y } = this.orbit;
    const f = Math.min(time / STEP, x.length - 1),
      i = Math.floor(f),
      j = Math.min(i + 1, x.length - 1),
      k = f - i;
    return [mix(x[i], x[j], k), mix(y[i], y[j], k)];
  }

  draw(t: number, seconds: number): void {
    const p = this.p;
    p.backdrop(seconds);
    const time = mix(this.begin, this.orbit.end, clamp(t / COLLIDE));
    p.scene();
    this.ripples(t, time);
    if (t < COLLIDE) this.stars(time);
    else this.explosion(t);
  }

  private ripples(t: number, time: number): void {
    const p = this.p,
      reach = Math.hypot(p.halfWidth, p.halfHeight);
    const fade = 1 - span(t, COLLIDE, COLLIDE + 0.16);
    if (fade <= 0) return;
    // Past the collision, rings keep travelling on real time.
    const now =
      t < COLLIDE
        ? time
        : this.orbit.end + ((t - COLLIDE) / COLLIDE) * (this.orbit.end - this.begin);
    for (const ripple of this.orbit.ripples) {
      if (ripple.time > now) break;
      const r = (now - ripple.time) * 230;
      if (r > reach) continue;
      p.alpha(ripple.strength * 0.4 * (1 - r / reach) * fade, () =>
        p.ring(0, 0, r, '#7f97d6', p.unit),
      );
    }
  }

  private stars(time: number): void {
    const p = this.p,
      u = p.unit;
    const [sx, sy] = this.separation(time);
    const close = clamp(1 - Math.hypot(sx, sy) / 60);
    const colors = [
      { glow: '#a4ddff', trail: '#7cc6ea', core: '#e9f7ff' },
      { glow: '#d8c2ff', trail: '#b49ce0', core: '#f6efff' },
    ];
    for (let side = 0; side < 2; side++) {
      const sign = side ? 0.5 : -0.5;
      const trail: Point[] = [];
      for (let k = 0; k <= 28; k++) {
        const [x, y] = this.separation(time - k * 0.011);
        trail.push([x * sign, y * sign]);
      }
      for (let k = 0; k < trail.length - 1; k++)
        p.alpha(0.7 * (1 - k / trail.length), () =>
          p.line([trail[k], trail[k + 1]], colors[side].trail, u),
        );
      const [x, y] = trail[0];
      p.glow(x, y, 20 + close * 14, colors[side].glow, 0.85 + close * 0.6);
      p.circle(x, y, 4.2, colors[side].core);
      p.rect(x - u, y - u, u, u, '#ffffff');
    }
  }

  private explosion(t: number): void {
    const p = this.p,
      s = p.scale,
      px = p.px;
    const cx = p.w / 2,
      cy = p.h / 2;
    const growth = span(t, COLLIDE + 0.025, 0.9);
    const radius = easeOut(growth) * (Math.hypot(p.w, p.h) / 2 + 60);
    p.screen();
    // The flash and ember glow belong to the sky, so the blast wave sweeps
    // them away with it rather than leaving them over the page.
    p.glow(cx, cy, 50 * s, '#ffb27a', 0.7 * (1 - span(t, COLLIDE + 0.02, COLLIDE + 0.12)));
    const flash = 1 - span(t, COLLIDE + 0.015, COLLIDE + 0.07);
    p.glow(cx, cy, mix(20, 110, smooth(span(t, COLLIDE, COLLIDE + 0.025))) * s, '#ffffff', flash);
    p.alpha(1 - span(t, COLLIDE, COLLIDE + 0.05), () => p.circle(cx, cy, 10 * s, '#ffffff'));
    // Erase inside the blast wave in three steps, leaving a dithered edge.
    p.erase(() => {
      p.alpha(0.3, () => p.circle(cx, cy, radius, '#000'));
      p.alpha(0.5, () => p.circle(cx, cy, radius - px * 2, '#000'));
      p.circle(cx, cy, radius - px * 4, '#000');
    });
    p.alpha(1 - growth * 0.75, () => p.ring(cx, cy, radius, '#f1eaff', px * 2));
    p.alpha(0.6 * (1 - growth), () => p.ring(cx, cy, radius - px * 4, '#b7a4ea', px));

    // Ejecta streaks, warm like the red glow of a real kilonova.
    const palette = ['#ffb36b', '#ff7f5f', '#ffd89a', '#e5c8ff'];
    for (let i = 0; i < 40; i++) {
      const angle = TAU * hash(i, 41),
        reach = radius * (0.3 + 0.62 * hash(i, 42)),
        length = (5 + 9 * hash(i, 43)) * s;
      const fade = 1 - span(t, 0.76 + hash(i, 44) * 0.06, 0.9);
      const dx = Math.cos(angle),
        dy = Math.sin(angle);
      p.alpha(fade, () =>
        p.line(
          [
            [cx + dx * Math.max(0, reach - length), cy + dy * Math.max(0, reach - length)],
            [cx + dx * reach, cy + dy * reach],
          ],
          palette[i % palette.length],
          px,
        ),
      );
    }
  }
}
