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
          const x = (Math.cos(angle) - Math.cos(start)) * width * 0.36;
          const y = (Math.sin(angle) - Math.sin(start)) * height * 0.36;
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
              this.rotation += (Math.min(now - previous, 60) / 180000) * Math.PI * 2;
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
  private angle(index: number): number {
    return ((-150 + index * 60) * Math.PI) / 180;
  }
  initialX(index: number): number {
    return 50 + Math.cos(this.angle(index)) * 36;
  }
  initialY(index: number): number {
    return 50 + Math.sin(this.angle(index)) * 36;
  }
  leaveFocus(event: FocusEvent): void {
    if (!this.orbit().nativeElement.contains(event.relatedTarget as Node | null)) {
      this.focused.set(false);
      this.hovered.set(null);
    }
  }
}
