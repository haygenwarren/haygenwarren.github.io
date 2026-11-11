import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrivalService } from '../../core/services/arrival.service';
import { DeepFieldComponent } from '../../shared/components/deep-field/deep-field';
import { OrbitalNavigationComponent } from '../../shared/components/orbital-navigation/orbital-navigation';
import { ContactRequestComponent } from '../../shared/components/contact-request/contact-request';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DeepFieldComponent, OrbitalNavigationComponent, ContactRequestComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  arrival = inject(ArrivalService);
  paused = signal(false);
  still = computed(() => this.paused() || this.arrival.reducedMotion());
  socialLinks = [
    { label: 'GitHub', href: 'https://github.com/haygenwarren' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/haygenwarren/' },
    { label: 'Instagram', href: 'https://www.instagram.com/haygen.jpg/' },
    { label: 'X', href: 'https://x.com/haygenwarren' },
  ];
  constructor() {
    try {
      this.paused.set(localStorage.getItem('portfolio-motion-paused') === 'true');
    } catch {
      /* Optional preference. */
    }
    afterNextRender(() => this.arrival.arrive());
  }
  toggleMotion(): void {
    this.paused.update((value) => !value);
    try {
      localStorage.setItem('portfolio-motion-paused', String(this.paused()));
    } catch {
      /* Optional preference. */
    }
  }
}
