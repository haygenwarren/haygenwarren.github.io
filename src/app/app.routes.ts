import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Home',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'experience',
    title: 'Work',
    data: { section: 'work' },
    loadComponent: () => import('./pages/experience/experience').then((m) => m.ExperienceComponent),
  },
  {
    path: 'research',
    title: 'Research',
    data: { section: 'research' },
    loadComponent: () => import('./pages/experience/experience').then((m) => m.ExperienceComponent),
  },
  {
    path: 'writing',
    title: 'Writing',
    loadComponent: () => import('./pages/writing/writing').then((m) => m.WritingComponent),
  },
  {
    path: 'education',
    title: 'Education',
    loadComponent: () => import('./pages/education/education').then((m) => m.EducationComponent),
  },
  {
    path: 'photography',
    title: 'Photography',
    loadComponent: () =>
      import('./pages/photography/photography').then((m) => m.PhotographyComponent),
  },
  {
    path: 'blog',
    title: 'Blog',
    loadComponent: () =>
      import('./pages/blog/blog-index/blog-index').then((m) => m.BlogIndexComponent),
  },
  {
    path: 'blog/:slug',
    title: 'Blog',
    loadComponent: () =>
      import('./pages/blog/blog-post/blog-post').then((m) => m.BlogPostComponent),
  },
  {
    path: 'about',
    title: 'About',
    loadComponent: () => import('./pages/about/about').then((m) => m.AboutComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
