import {
  Component,
  ElementRef,
  NgZone,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArrivalService } from '../../../core/services/arrival.service';
import { PixelIconComponent, PixelIconName } from '../pixel-icon/pixel-icon';

/** Orbit radii as fractions of the orbit box (kept in sync with the SVG). The
 * vertical radius leaves room above and below the portrait for satellites. */
const ORBIT_X = 0.38;
const ORBIT_Y = 0.4;
/** Milliseconds for one full revolution of the satellites. */
const ORBIT_PERIOD = 120_000;

interface Destination {
  label: string;
  /** A route on this site, or a full URL when `external` is set. */
  path: string;
  /** Opens another site in a new tab instead of navigating within this one. */
  external?: boolean;
  icon: PixelIconName;
  color: string;
  note: string;
}
@Component({
  selector: 'app-orbital-navigation',
  imports: [RouterLink, NgTemplateOutlet, PixelIconComponent],
  templateUrl: './orbital-navigation.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './orbital-navigation.scss',
})
export class OrbitalNavigationComponent {
  arrival = inject(ArrivalService);
  private zone = inject(NgZone);
  private orbit = viewChild.required<ElementRef<HTMLElement>>('orbit');
  private satellites = viewChildren<ElementRef<HTMLElement>>('satellite');
  paused = input(false);
  hovered = signal<Destination | null>(null);
  /** The portrait (link to About) is pointed at or focused. */
  aboutHint = signal(false);
  interacting = signal(false);
  focused = signal(false);
  still = computed(() => this.paused() || this.arrival.reducedMotion());
  private stopOrbit = computed(
    () => this.still() || this.interacting() || this.focused() || !!this.arrival.active(),
  );
  private rotation = 0;

  destinations: Destination[] = [
    {
      label: 'Home',
      path: '/',
      icon: 'home',
      color: '#c8c5a4',
      note: 'You are here. Make yourself at home.',
    },
    {
      label: 'Research',
      path: '/research',
      icon: 'telescope',
      color: '#b8abe8',
      note: 'From radio observations to optical data tools.',
    },
    {
      label: 'Work',
      path: '/experience',
      icon: 'work',
      color: '#9bbfe3',
      note: 'Engineering projects and spaceflight journalism.',
    },
    {
      label: 'Education',
      path: '/education',
      icon: 'book',
      color: '#a6c9b2',
      note: 'Physics and astrophysics at UNC–Chapel Hill.',
    },
    {
      label: 'Writing',
      path: '/writing',
      icon: 'news',
      color: '#9dd3cf',
      note: 'Spaceflight reporting for NASASpaceflight.com.',
    },
    {
      label: 'Photography',
      path: '/photography',
      icon: 'camera',
      color: '#e1b88f',
      note: 'A slower way to look at the world.',
    },
    {
      label: 'Blog',
      path: '/blog',
      icon: 'pen',
      color: '#d4a6b8',
      note: 'Thoughts on science, craft, and observation.',
    },
    {
      label: 'Mission Atlas',
      path: 'https://mission-atlas.net',
      external: true,
      icon: 'mission-atlas',
      color: '#efe8d6', // the emblem's parchment ring
      note: 'A live map of where 100 space missions are now.',
    },
  ];
  constructor() {
    afterRenderEffect((onCleanup) => {
      const host = this.orbit().nativeElement;
      const elements = this.satellites().map((ref) => ref.nativeElement);
      const stop = this.stopOrbit();
      let width = host.clientWidth,
        height = host.clientHeight;
      const position = () =>
        elements.forEach((element, i) => {
          const start = this.angle(i),
            angle = start + this.rotation;
          const x = (Math.cos(angle) - Math.cos(start)) * width * ORBIT_X;
          const y = (Math.sin(angle) - Math.sin(start)) * height * ORBIT_Y;
          element.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
        });
      const observer = new ResizeObserver(() => {
        width = host.clientWidth;
        height = host.clientHeight;
        position();
      });
      observer.observe(host);
      let previous = 0,
        frame = 0;
      position();
      if (!stop)
        this.zone.runOutsideAngular(() => {
          const tick = (now: number) => {
            if (previous && !document.hidden)
              this.rotation += (Math.min(now - previous, 60) / ORBIT_PERIOD) * Math.PI * 2;
            previous = now;
            position();
            frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        });
      onCleanup(() => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      });
    });
  }
  /**
   * Evenly spaced starting angles, with the second destination (Research) at
   * the top, so reading clockwise from Home follows the header's page order.
   */
  private angle(index: number): number {
    return -Math.PI / 2 + ((index - 1) * Math.PI * 2) / this.destinations.length;
  }
  initialX(index: number): number {
    return 50 + Math.cos(this.angle(index)) * ORBIT_X * 100;
  }
  initialY(index: number): number {
    return 50 + Math.sin(this.angle(index)) * ORBIT_Y * 100;
  }
  /** Hold the orbit still only while a destination is pointed at or
   * keyboard-focused, so it is easy to click; the rest of the time it moves. */
  hold(destination: Destination, byFocus = false): void {
    this.hovered.set(destination);
    (byFocus ? this.focused : this.interacting).set(true);
  }
  release(byFocus = false): void {
    (byFocus ? this.focused : this.interacting).set(false);
    if (!this.focused() && !this.interacting()) this.hovered.set(null);
  }
}
