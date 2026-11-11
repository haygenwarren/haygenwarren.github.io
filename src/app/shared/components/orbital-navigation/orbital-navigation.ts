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
} from '@angular/core';
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
  path: string;
  icon: PixelIconName;
  color: string;
  note: string;
}
@Component({
  selector: 'app-orbital-navigation',
  imports: [RouterLink, PixelIconComponent],
  templateUrl: './orbital-navigation.html',
  styleUrl: './orbital-navigation.scss',
})
export class OrbitalNavigationComponent {
  arrival = inject(ArrivalService);
  private zone = inject(NgZone);
  private orbit = viewChild.required<ElementRef<HTMLElement>>('orbit');
  private satellites = viewChildren<ElementRef<HTMLElement>>('satellite');
  paused = input(false);
  hovered = signal<Destination | null>(null);
  interacting = signal(false);
  focused = signal(false);
  still = computed(() => this.paused() || this.arrival.reducedMotion());
  private stopOrbit = computed(
    () => this.still() || this.interacting() || this.focused() || !!this.arrival.active(),
  );
  private rotation = 0;

  destinations: Destination[] = [
    {
      label: 'Research',
      path: '/research',
      icon: 'telescope',
      color: '#b8abe8',
      note: 'From radio observations to optical data tools.',
    },
    {
      label: 'Photography',
      path: '/photography',
      icon: 'camera',
      color: '#e1b88f',
      note: 'A slower way to look at the world.',
    },
    {
      label: 'Education',
      path: '/education',
      icon: 'book',
      color: '#a6c9b2',
      note: 'Physics and astrophysics at UNC–Chapel Hill.',
    },
    {
      label: 'Work',
      path: '/experience',
      icon: 'work',
      color: '#9bbfe3',
      note: 'Engineering projects and spaceflight journalism.',
    },
    {
      label: 'Writing',
      path: '/writing',
      icon: 'news',
      color: '#9dd3cf',
      note: 'Spaceflight reporting for NASASpaceflight.com.',
    },
    {
      label: 'Blog',
      path: '/blog',
      icon: 'pen',
      color: '#d4a6b8',
      note: 'Thoughts on science, craft, and observation.',
    },
    {
      label: 'Home',
      path: '/',
      icon: 'home',
      color: '#c8c5a4',
      note: 'You are here. Make yourself at home.',
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
  /** Evenly spaced starting angles, with the second destination at the top. */
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
