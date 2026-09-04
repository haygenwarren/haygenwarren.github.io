import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'experience',
    loadComponent: () =>
      import('./pages/experience/experience').then(m => m.ExperienceComponent),
  },
  {
    path: 'education',
    loadComponent: () =>
      import('./pages/education/education').then(m => m.EducationComponent),
  },
  {
    path: 'photography',
    loadComponent: () =>
      import('./pages/photography/photography').then(m => m.PhotographyComponent),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./pages/blog/blog-index/blog-index').then(m => m.BlogIndexComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./pages/blog/blog-post/blog-post').then(m => m.BlogPostComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about').then(m => m.AboutComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
