import { captureHome, toNegative } from '../home-capture';
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

const CAM = 1.35; // camera artwork scale, in scene units per camera unit
const WINDOW: Point = [-80, -55]; // eyepiece window, top-left, camera units
const T = {
  closer: [0.07, 0.23],
  focus: [0.23, 0.29],
  click: 0.3,
  back: [0.33, 0.42],
  rewind: [0.42, 0.45],
  door: [0.45, 0.5],
  lift: [0.5, 0.55],
  exit: [0.5, 0.56],
  unroll: [0.53, 0.59],
  tankIn: [0.57, 0.61],
  dip: [0.61, 0.645],
  agitate: [0.645, 0.705],
  rise: [0.705, 0.74],
  cut: [0.745, 0.79],
  tankOut: [0.74, 0.775],
  centre: [0.745, 0.785],
  scanner: [0.765, 0.8],
  scan: [0.8, 0.87],
  zoom: [0.87, 0.955],
  fade: [0.955, 0.995],
} as const;

interface Photo {
  positive: HTMLCanvasElement;
  negative: HTMLCanvasElement;
  background: [string, string];
}

/** A film camera moves in until its viewfinder shows the page; the shutter
 * fires, the roll is developed and scanned, and the frame becomes the page. */
export class CameraScene implements Scene {
  private aspect: number;
  private fw: number;
  private fh = 40;
  private gap = 8;
  private stripW: number;
  private stripH: number;
  private ew: number;
  private eh = 15;
  private maxZoom: number;
  private finalZoom: number;
  private home: Photo | null = null;
  private photos: (Photo | null)[];

  constructor(private p: Painter) {
    this.aspect = clamp(p.w / p.h, 0.62, 1.6);
    this.fw = this.fh * this.aspect;
    this.stripW = 3 * this.fw + 2 * this.gap + 16;
    this.stripH = this.fh + 22;
    this.ew = this.eh * this.aspect;
    this.maxZoom =
      0.92 * Math.min(p.w / (this.ew * CAM * p.scale), p.h / (this.eh * CAM * p.scale));
    // Fit the screen-shaped picture inside the centre frame; zooming until it
    // spans the viewport lands every pixel on the page beneath.
    const screen = p.w / p.h;
    const imageWidth = Math.min(this.fw, this.fh * screen);
    this.finalZoom = p.w / (imageWidth * p.scale);
    this.photos = [this.landscape(), null, this.nightSky()];
  }

  draw(t: number, seconds: number): void {
    const p = this.p;
    if (!this.home) this.capture();
    p.backdrop(seconds);
    p.scene();
    if (t < T.exit[1]) this.cameraStage(t, seconds);
    if (t >= T.lift[0]) this.filmStage(t, seconds);
    const fade = smooth(span(t, ...T.fade));
    if (fade > 0) {
      p.grid();
      p.erase(() => p.alpha(fade, () => p.rect(0, 0, p.cols, p.rows, '#000')));
    }
  }

  private capture(): void {
    const positive = captureHome(this.p.w, this.p.h);
    if (!positive) return;
    this.home = { positive, negative: toNegative(positive), background: ['#070a16', '#f9a960'] };
    this.photos[1] = this.home;
  }

  // ─── Camera ──────────────────────────────────────────────────────────────

  private cameraStage(t: number, seconds: number): void {
    const p = this.p,
      c = p.ctx;
    const appear = smooth(span(t, 0, 0.06));
    const closer = smooth(span(t, ...T.closer)) * (1 - smooth(span(t, ...T.back)));
    const zoom = Math.pow(this.maxZoom, closer);
    // Keep the eyepiece moving steadily toward the centre while zooming.
    const reach = 1 - (1 - closer) / zoom;
    const ex = WINDOW[0] + this.ew / 2,
      ey = WINDOW[1] + this.eh / 2;
    const drop = easeIn(span(t, ...T.exit)) * (p.halfHeight + 160);
    const kick =
      t > T.click && t < T.click + 0.012 ? (hash(Math.floor(seconds * 60)) - 0.5) * 3 : 0;
    p.save(() => {
      c.translate(kick, (1 - appear) * 16 + drop);
      c.scale(zoom, zoom);
      c.translate(-ex * CAM * reach, -ey * CAM * reach);
      c.scale(CAM, CAM);
      p.alpha(appear, () => this.camera(t, p.unit / (CAM * zoom)));
    });
  }

  private camera(t: number, u: number): void {
    const p = this.p,
      c = p.ctx;
    const door = smooth(span(t, ...T.door));
    const pressed = t > T.click - 0.006 && t < T.click + 0.02 ? 1.5 : 0;
    p.rect(-100, -54, 5, 9, '#87939e');
    p.rect(95, -54, 5, 9, '#87939e');
    // Rewind knob, with its crank spinning while the film winds back.
    p.rect(-84, -70, 24, 8, '#9aa5ae');
    p.rect(-84, -70, 24, 2, '#c9d0d6');
    const turn = span(t, ...T.rewind);
    if (turn > 0 && turn < 1) {
      const arm = Math.cos(turn * Math.PI * 8) * 11;
      p.rect(-72 + Math.min(0, arm), -74, Math.abs(arm) + 2, 3, '#e3e8eb');
    }
    // Hot shoe, film-advance lever, shutter-speed dial and release.
    p.rect(-12, -68, 22, 6, '#87939e');
    p.rect(-10, -70, 18, 2, '#aab4bc');
    p.rect(44, -65, 58, 2.5, '#5c6873');
    p.rect(98, -66, 5, 4, '#5c6873');
    p.rect(34, -69, 26, 7, '#9aa5ae');
    for (let k = 0; k < 5; k++) p.rect(37 + k * 5, -68, 1, 3, '#5c6873');
    p.rect(66, -71 + pressed, 10, 6 - pressed, '#e3e8eb');
    p.rect(-96, -62, 192, 28, '#c4ccd3');
    p.rect(-96, -62, 192, 2, '#e6eaed');
    p.rect(-96, -37, 192, 3, '#87939e');
    p.circle(50, -48, 4.5, '#1c242d');
    p.rect(49, -49.5, 2, 3, '#e6eaed');
    const [wx, wy] = WINDOW;
    p.rect(wx - 5, wy - 5, this.ew + 10, this.eh + 10, '#151b22');
    p.rect(wx - 3, wy - 3, this.ew + 6, this.eh + 6, '#2a333d');
    this.viewfinder(t, u);

    if (door <= 0) this.back(-96, false, u);
    else {
      // Open back: film gate, take-up spool and (until lifted) the cassette.
      p.rect(-94, -34, 188, 70, '#0b1016');
      p.rect(-36, -28, 72, 54, '#1c242e');
      p.rect(-40, -31, 80, 3, '#55606b');
      p.rect(-40, 25, 80, 3, '#55606b');
      p.rect(56, -28, 20, 56, '#3a444f');
      p.rect(62, -28, 8, 56, '#55606b');
      if (t < T.lift[0])
        p.save(() => {
          c.translate(-71, 0);
          c.scale(1 / CAM, 1 / CAM);
          this.cassette(0, 0);
        });
      // The door swings about its left hinge, flattening as it turns away.
      p.save(() => {
        const swing = Math.cos(door * Math.PI * 0.85);
        c.translate(-96, 0);
        c.transform(swing, -0.25 * Math.sin(door * Math.PI), 0, 1, 0, 0);
        this.back(0, swing < 0, u);
      });
    }
    p.rect(-96, 36, 192, 6, '#9aa5ae');
  }

  private back(x: number, inside: boolean, u: number): void {
    const p = this.p;
    p.rect(x, -34, 192, 70, inside ? '#151b22' : '#1f2731');
    if (inside) {
      p.rect(x + 62, -22, 68, 46, '#2f3944');
      return;
    }
    for (let y = -30; y < 34; y += 6) p.rect(x + 4, y, 184, u, '#262f3a');
    p.rect(x + 138, -24, 38, 22, '#0e141a');
    p.rect(x + 141, -21, 32, 16, '#6aa6a1');
    p.rect(x + 141, -15, 32, 4, '#e9e1c8');
    p.rect(x + 184, -10, 4, 18, '#5c6873');
    p.rect(x, -34, 3, 70, '#2b3541');
  }

  /** What the photographer sees: the page, bright-line frame, and a
   * rangefinder patch whose double image slides into focus. */
  private viewfinder(t: number, u: number): void {
    const p = this.p,
      c = p.ctx;
    const [x, y] = WINDOW,
      { ew, eh } = this;
    p.rect(x, y, ew, eh, '#0b0f16');
    p.save(() => {
      c.beginPath();
      c.rect(x, y, ew, eh);
      c.clip();
      this.photo(this.home, x, y, ew, eh, false);
      const offset = (1 - smooth(span(t, ...T.focus))) * ew * 0.06;
      const pw = ew * 0.13,
        ph = eh * 0.13;
      c.beginPath();
      c.rect(x + (ew - pw) / 2, y + (eh - ph) / 2, pw, ph);
      c.clip();
      p.alpha(0.5, () => this.photo(this.home, x + offset, y, ew, eh, false));
      p.alpha(0.16, () => p.rect(x, y, ew, eh, '#ffe9a8'));
    });
    const ix = ew * 0.07,
      iy = eh * 0.08;
    p.alpha(0.85, () =>
      p.line(
        [
          [x + ix, y + iy],
          [x + ew - ix, y + iy],
          [x + ew - ix, y + eh - iy],
          [x + ix, y + eh - iy],
          [x + ix, y + iy],
        ],
        '#f3e7b0',
        u,
      ),
    );
    // The shutter fires: a blink of darkness.
    if (t >= T.click && t < T.click + 0.016) p.rect(x, y, ew, eh, '#000');
  }

  private cassette(x: number, y: number): void {
    const p = this.p;
    p.rect(x - 4, y - 36, 8, 7, '#b9c2c9');
    p.rect(x - 4, y + 29, 8, 7, '#b9c2c9');
    p.rect(x - 12, y - 30, 24, 60, '#2e3742');
    p.rect(x - 10, y - 26, 20, 52, '#6aa6a1');
    p.rect(x - 10, y - 8, 20, 6, '#e9e1c8');
    p.rect(x - 12, y - 30, 3, 60, '#4a5561');
  }

  // ─── Film ────────────────────────────────────────────────────────────────

  private filmStage(t: number, seconds: number): void {
    const p = this.p,
      c = p.ctx,
      u = p.unit;
    const { stripW, stripH } = this;
    let y = mix(-30, 72, smooth(span(t, ...T.dip)));
    y = mix(y, -30, smooth(span(t, ...T.rise)));
    y = mix(y, 0, smooth(span(t, ...T.centre)));

    const tankY =
      mix(p.halfHeight + 150, 0, easeOut(span(t, ...T.tankIn))) +
      easeIn(span(t, ...T.tankOut)) * (p.halfHeight + 220);
    const tankVisible = t >= T.tankIn[0] && t < T.tankOut[1];
    const top = 52 + tankY;
    const agitate = span(t, ...T.agitate);
    const rock = Math.sin(agitate * Math.PI * 6) * Math.sin(agitate * Math.PI) * 0.07;
    const inTank = (draw: () => void) =>
      p.save(() => {
        c.translate(0, top + 46);
        c.rotate(rock);
        c.translate(0, -top - 46);
        draw();
      });

    p.save(() => {
      c.scale(...this.zoomAt(t));
      const bed = smooth(span(t, ...T.scanner));
      p.alpha(bed, () => {
        p.rect(-stripW / 2 - 20, -stripH / 2 - 18, stripW + 40, stripH + 36, '#232c37');
        p.rect(-stripW / 2 - 14, -stripH / 2 - 10, stripW + 28, stripH + 20, '#d7e4ea');
      });
      if (tankVisible)
        inTank(() => {
          p.ellipse(0, top, (stripW + 30) / 2 + 6, 8, '#101925');
          p.ellipse(0, top, (stripW + 30) / 2, 6, '#3f6f7f');
        });
      const strip = () => this.strip(t, y);
      if (agitate > 0 && agitate < 1) inTank(strip);
      else strip();
      this.lostCassette(t, y);
      if (tankVisible) inTank(() => this.tank(top, t, seconds));
      // Drips from the freshly developed film.
      const wet =
        span(t, T.rise[0] + 0.01, T.rise[1]) * (1 - span(t, T.centre[1] - 0.01, T.centre[1]));
      for (let k = 0; k < 10; k++) {
        const phase = (seconds * 1.3 + hash(k, 62)) % 1;
        p.alpha(wet * (1 - phase), () =>
          p.rect(
            -stripW / 2 + hash(k, 61) * stripW,
            y + stripH / 2 + phase * 46,
            u,
            u * 2,
            '#6fb2c4',
          ),
        );
      }
    });
  }

  private zoomAt(t: number): [number, number] {
    const z = Math.pow(this.finalZoom, smooth(span(t, ...T.zoom)));
    return [z, z];
  }

  /** The cassette lifts out of the camera, leads the film out, and drops
   * away once the developed strip is cut free. */
  private lostCassette(t: number, y: number): void {
    const lift = smooth(span(t, ...T.lift));
    const end: Point = [this.stripW / 2 + 14, -30];
    const x = mix(-71 * CAM, end[0], lift);
    let cy = mix(0, end[1], lift) - Math.sin(lift * Math.PI) * 30;
    if (lift >= 1) cy = y;
    cy += easeIn(span(t, ...T.cut)) * (this.p.halfHeight + 150);
    if (t < T.cut[1]) this.cassette(x, cy);
  }

  private strip(t: number, y: number): void {
    const p = this.p,
      c = p.ctx;
    const { fw, fh, gap, stripW, stripH } = this;
    const left = -stripW / 2;
    const unroll = smooth(span(t, ...T.unroll));
    if (unroll <= 0) return;
    const developed = t >= T.rise[0] + 0.015;
    const lit = t >= T.scanner[0];
    const scanned = smooth(span(t, ...T.scan));
    const scanX = left + scanned * stripW;
    p.save(() => {
      c.beginPath();
      c.rect(left + (1 - unroll) * stripW, y - stripH, stripW * unroll, stripH * 2);
      c.clip();
      const layer = (positive: boolean) => {
        p.rect(
          left,
          y - stripH / 2,
          stripW,
          stripH,
          positive ? '#141110' : developed ? '#b5703a' : '#3b2c22',
        );
        const hole = lit ? '#eef5f7' : '#0b0f16';
        for (let x = left + 3; x < left + stripW - 3; x += 6.5) {
          p.rect(x, y - stripH / 2 + 2.5, 3.2, 3.6, hole);
          p.rect(x, y + stripH / 2 - 6.1, 3.2, 3.6, hole);
        }
        for (let i = 0; i < 3; i++) {
          const fx = (i - 1) * (fw + gap) - fw / 2,
            fy = y - fh / 2;
          if (developed) this.photo(this.photos[i], fx, fy, fw, fh, !positive);
          else p.rect(fx, fy, fw, fh, '#4c3a2e');
        }
      };
      layer(false);
      // Behind the scan head the negative is converted to a positive.
      if (scanned > 0) {
        c.beginPath();
        c.rect(left, y - stripH, scanX - left, stripH * 2);
        c.clip();
        layer(true);
      }
    });
    if (scanned > 0 && scanned < 1) {
      p.glow(scanX, y, 34, '#bdf3ff', 0.9);
      p.line(
        [
          [scanX, y - stripH / 2 - 8],
          [scanX, y + stripH / 2 + 8],
        ],
        '#ffffff',
        p.unit * 1.2,
      );
    }
  }

  private tank(top: number, t: number, seconds: number): void {
    const p = this.p,
      u = p.unit;
    const tw = this.stripW + 30;
    p.rect(-tw / 2, top, tw, 92, '#5d6b7a');
    p.rect(-tw / 2 + 10, top, 14, 92, '#8796a4');
    p.rect(-tw / 2, top, tw, 3, '#c2ccd4');
    p.rect(-tw * 0.3, top + 28, tw * 0.6, 30, '#27333f');
    p.rect(-tw * 0.22, top + 38, tw * 0.44, u, '#576879');
    p.rect(-tw * 0.22, top + 46, tw * 0.3, u, '#576879');
    p.rect(-tw / 2 - 8, top + 20, 8, 34, '#8695a4');
    p.rect(tw / 2, top + 20, 8, 34, '#8695a4');
    const bubbling = span(t, ...T.agitate) > 0 && span(t, ...T.agitate) < 1;
    if (bubbling)
      for (let k = 0; k < 14; k++) {
        const phase = (seconds * 2 + hash(k, 71)) % 1;
        p.alpha(1 - phase, () =>
          p.rect(-tw / 2 + 8 + hash(k, 72) * (tw - 16), top - 2 - phase * 7, u, u, '#cfe9f2'),
        );
      }
  }

  private photo(
    photo: Photo | null,
    x: number,
    y: number,
    w: number,
    h: number,
    negative: boolean,
  ): void {
    const p = this.p;
    if (!photo) {
      // Placeholder until the page underneath has rendered.
      p.rect(x, y, w, h, negative ? '#f9a960' : '#070a16');
      p.circle(x + w / 2, y + h * 0.45, h * 0.14, negative ? '#6b5a49' : '#8f9dba');
      return;
    }
    const image = negative ? photo.negative : photo.positive;
    const fit = Math.min(w / image.width, h / image.height);
    const iw = image.width * fit,
      ih = image.height * fit;
    p.rect(x, y, w, h, photo.background[negative ? 1 : 0]);
    p.ctx.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }

  // ─── Neighbouring frames: two small pixel photographs ────────────────────

  private sketch(paint: (c: CanvasRenderingContext2D, w: number, h: number) => void): Photo {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = Math.round(48 / this.aspect);
    const c = canvas.getContext('2d')!;
    paint(c, canvas.width, canvas.height);
    const corner = c.getImageData(0, 0, 1, 1).data;
    const negative = toNegative(canvas);
    const negCorner = negative.getContext('2d')!.getImageData(0, 0, 1, 1).data;
    return {
      positive: canvas,
      negative,
      background: [
        `rgb(${corner[0]},${corner[1]},${corner[2]})`,
        `rgb(${negCorner[0]},${negCorner[1]},${negCorner[2]})`,
      ],
    };
  }

  private landscape(): Photo {
    return this.sketch((c, w, h) => {
      const band = (y0: number, y1: number, color: string) => {
        c.fillStyle = color;
        c.fillRect(0, Math.round(y0 * h), w, Math.ceil((y1 - y0) * h));
      };
      band(0, 0.3, '#7e6a96');
      band(0.3, 0.46, '#d98a77');
      band(0.46, 1, '#f2c48d');
      c.fillStyle = '#fff1c9';
      c.beginPath();
      c.arc(w * 0.68, h * 0.56, w * 0.09, 0, Math.PI * 2);
      c.fill();
      const ridge = (base: number, height: number, color: string, seed: number) => {
        c.fillStyle = color;
        c.beginPath();
        c.moveTo(0, h);
        for (let x = 0; x <= w; x += 4) c.lineTo(x, h * (base - height * hash(x, seed)));
        c.lineTo(w, h);
        c.fill();
      };
      ridge(0.66, 0.16, '#5b5578', 3);
      ridge(0.8, 0.1, '#2e3350', 4);
    });
  }

  private nightSky(): Photo {
    return this.sketch((c, w, h) => {
      c.fillStyle = '#0b1230';
      c.fillRect(0, 0, w, h);
      for (let k = 0; k < 160; k++) {
        const x = hash(k, 81) * w;
        const y = (x / w) * h * 0.55 + (hash(k, 82) - 0.5) * h * 0.28 + h * 0.08;
        c.globalAlpha = 0.35 + hash(k, 83) * 0.5;
        c.fillStyle = k % 3 ? '#b9c3e6' : '#e6d6c0';
        c.fillRect(Math.floor(x), Math.floor(y), 1, 1);
      }
      c.globalAlpha = 1;
      c.fillStyle = '#04060c';
      for (let x = -2; x < w; x += 5) {
        const tall = h * (0.12 + 0.12 * hash(x + 5, 84));
        c.beginPath();
        c.moveTo(x, h);
        c.lineTo(x + 3, h * 0.86 - tall);
        c.lineTo(x + 6, h);
        c.fill();
      }
      c.fillRect(0, h * 0.9, w, h * 0.1);
    });
  }
}
