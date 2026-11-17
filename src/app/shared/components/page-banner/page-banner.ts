import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BannerService } from '../../../core/services/banner.service';

// 4×4 ordered-dither thresholds (0–15), as in the arrival animations.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const CELL = 4; // CSS pixels per dither pixel

/**
 * Full-width photo banner with the page title. The photo for each page is set
 * in content/site/banners.json; its lower edge dissolves into the page in
 * pixels, echoing the homepage arrivals.
 */
@Component({
  selector: 'app-page-banner',
  templateUrl: './page-banner.html',
  styleUrl: './page-banner.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '(contextmenu)': 'protect($event)',
    '(dragstart)': 'protect($event)',
  },
})
export class PageBannerComponent {
  /** Key in banners.json, e.g. "research". */
  page = input.required<string>();
  heading = input.required<string>();

  private readonly banners = toSignal(inject(BannerService).getBanners());
  readonly banner = computed(() => this.banners()?.[this.page()]);
  readonly loaded = signal(false);
  private readonly dither = viewChild.required<ElementRef<HTMLCanvasElement>>('dither');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Redraw the dissolve whenever the banner changes width.
    afterNextRender(() => {
      const canvas = this.dither().nativeElement;
      const observer = new ResizeObserver(() => this.drawDither(canvas));
      observer.observe(canvas);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Same casual-saving deterrent as the gallery: no image menu or dragging. */
  protect(event: Event): void {
    if (event.target instanceof HTMLImageElement) event.preventDefault();
  }

  /** Page-coloured pixels, sparse at the top of the strip and solid at the bottom. */
  private drawDither(canvas: HTMLCanvasElement): void {
    const w = Math.ceil(canvas.clientWidth / CELL),
      h = Math.ceil(canvas.clientHeight / CELL);
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = getComputedStyle(canvas).color;
    for (let y = 0; y < h; y++) {
      // Passes the highest threshold on the last row, so the seam is solid.
      const level = Math.pow((y + 1) / h, 1.2) * 17;
      for (let x = 0; x < w; x++)
        if (level > BAYER[(y % 4) * 4 + (x % 4)] + 0.5) ctx.fillRect(x, y, 1, 1);
    }
  }
}
