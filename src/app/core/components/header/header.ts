import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  menuOpen = signal(false);
  scrolled = signal(false);

  navItems: NavItem[] = [
    { path: '/',            label: 'Home',        exact: true },
    { path: '/experience',  label: 'Experience' },
    { path: '/education',   label: 'Education' },
    { path: '/photography', label: 'Photography' },
    { path: '/blog',        label: 'Blog' },
    { path: '/about',       label: 'About' },
  ];

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
