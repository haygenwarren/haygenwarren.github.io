import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type ArrivalKind = 'telescope' | 'camera' | 'rocket' | 'merger';
export interface Arrival {
  kind: ArrivalKind;
  title: string;
  caption: string;
  /** Length of the sequence in milliseconds. */
  duration: number;
  /** Progress (0–1) at which the overlay's top bar fades, as the page appears. */
  uiFade: number;
}
export const ARRIVALS: Arrival[] = [
  {
    kind: 'telescope',
    title: 'A signal from somewhere',
    caption: 'Finding a little corner of the universe.',
    duration: 7500,
    uiFade: 0.88,
  },
  {
    kind: 'camera',
    title: 'A different way of seeing',
    caption: 'One frame. A whole little world.',
    duration: 12500,
    uiFade: 0.87,
  },
  {
    kind: 'rocket',
    title: 'A small departure',
    caption: 'There is always somewhere else to go.',
    duration: 10000,
    uiFade: 0.84,
  },
  {
    kind: 'merger',
    title: 'An unlikely meeting',
    caption: 'Some things are drawn to each other.',
    duration: 7600,
    uiFade: 0.72,
  },
];

@Injectable({ providedIn: 'root' })
export class ArrivalService {
  active = signal<Arrival | null>(null);
  reducedMotion = signal(false);
  private hasArrived = false;
  private next = 0;

  constructor() {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      this.reducedMotion.set(preference.matches);
      if (preference.matches) this.active.set(null);
    };
    update();
    preference.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => preference.removeEventListener('change', update));
    try {
      const saved = Number(localStorage.getItem('portfolio-next-arrival') ?? 0);
      this.next = Number.isFinite(saved) ? Math.abs(Math.floor(saved)) % ARRIVALS.length : 0;
    } catch {
      /* Storage is optional. */
    }
  }

  arrive(): void {
    if (this.hasArrived) return;
    this.hasArrived = true;
    this.playNext();
  }

  playNext(): void {
    if (this.reducedMotion() || this.active()) return;
    this.active.set(ARRIVALS[this.next]);
    this.next = (this.next + 1) % ARRIVALS.length;
    try {
      localStorage.setItem('portfolio-next-arrival', String(this.next));
    } catch {
      /* Storage is optional. */
    }
  }

  dismiss(): void {
    this.active.set(null);
  }
}
