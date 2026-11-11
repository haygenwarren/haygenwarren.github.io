import {
  Component,
  ElementRef,
  HostListener,
  NgZone,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ARRIVALS, ArrivalService } from '../../../core/services/arrival.service';
import { ArrivalRenderer, clamp } from './arrival-renderer';

@Component({ selector: 'app-arrival', templateUrl: './arrival.html', styleUrl: './arrival.scss' })
export class ArrivalComponent {
  arrival = inject(ArrivalService);
  private zone = inject(NgZone);
  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private skip = viewChild<ElementRef<HTMLButtonElement>>('skip');
  leaving = signal(false);
  sceneNumber = () =>
    String(ARRIVALS.findIndex((scene) => scene.kind === this.arrival.active()?.kind) + 1).padStart(
      2,
      '0',
    );

  constructor() {
    afterRenderEffect((onCleanup) => {
      const scene = this.arrival.active();
      const canvas = this.canvas()?.nativeElement;
      if (!scene || !canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.arrival.dismiss();
        return;
      }
      const previousFocus = document.activeElement as HTMLElement | null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.leaving.set(false);
      this.skip()?.nativeElement.focus({ preventScroll: true });
      let frame = 0,
        start = 0;
      const renderer = new ArrivalRenderer(canvas);
      const resize = () => renderer.resize();
      window.addEventListener('resize', resize);
      this.zone.runOutsideAngular(() => {
        const tick = (now: number) => {
          if (!start) start = now;
          const progress = clamp((now - start) / scene.duration);
          renderer.draw(scene.kind, progress);
          this.leaving.set(scene.kind === 'telescope' ? progress > 0.92 : progress > 0.85);
          if (progress < 1) frame = requestAnimationFrame(tick);
          else this.arrival.dismiss();
        };
        frame = requestAnimationFrame(tick);
      });
      onCleanup(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', resize);
        document.body.style.overflow = previousOverflow;
        setTimeout(() => {
          const target =
            previousFocus && previousFocus !== document.body && previousFocus.isConnected
              ? previousFocus
              : document.getElementById('main-content');
          target?.focus({ preventScroll: true });
        }, 0);
      });
    });
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.arrival.active()) this.arrival.dismiss();
  }
}
