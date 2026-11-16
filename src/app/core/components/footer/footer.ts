import { Component, ChangeDetectionStrategy } from '@angular/core';

interface FooterLink {
  label: string;
  href: string;
  external: boolean;
  icon: 'github' | 'mail' | 'linkedin';
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.scss',
})
export class FooterComponent {
  year = new Date().getFullYear();

  links: FooterLink[] = [
    {
      label: 'GitHub',
      href: 'https://github.com/haygenwarren',
      external: true,
      icon: 'github',
    },
    {
      label: 'Email',
      href: 'mailto:haygenwarren@gmail.com',
      external: false,
      icon: 'mail',
    },
  ];
}
