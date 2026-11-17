import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT, ViewportScroller } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './core/components/header/header';
import { FooterComponent } from './core/components/footer/footer';
import { ArrivalComponent } from './shared/components/arrival/arrival';
import { ArrivalService } from './core/services/arrival.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ArrivalComponent],
  template: `
    <div class="site-shell" [inert]="!!arrival.active()">
      <a class="skip-link" href="#main-content">Skip to content</a>
      @if (!isHome()) {
        <app-header />
      }
      <main id="main-content" class="main-content" tabindex="-1"><router-outlet /></main>
      @if (!isHome()) {
        <app-footer />
      }
    </div>
    <app-arrival />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      :host,
      .site-shell {
        display: flex;
        flex-direction: column;
        min-height: 100svh;
      }
      .site-shell {
        flex: 1;
      }
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class App {
  constructor() {
    const document = inject(DOCUMENT);
    inject(ViewportScroller).setOffset(() => [
      0,
      document.querySelector('app-header header')?.getBoundingClientRect().height ?? 0,
    ]);
  }

  arrival = inject(ArrivalService);
  private router = inject(Router);
  private url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  isHome = computed(() => this.url().split(/[?#]/)[0] === '/');
}
