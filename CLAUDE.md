# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Generate content + serve (http://localhost:4200)
npm run build          # Generate content + production build
npm run generate       # Run content generation only (scripts/generate-content.js)
npx ng generate component src/app/shared/components/<name> --standalone
```

## Architecture

Angular 21 standalone SPA. Content is separated from the Angular application:

- **Source content** lives in `content/` (JSON + Markdown)
- **`scripts/generate-content.js`** reads `content/` and writes processed JSON to `public/assets/generated/`
- **Angular services** (`src/app/core/services/`) fetch those JSON files via `HttpClient`
- **Page components** (`src/app/pages/`) inject services and render data

`npm start` and `npm run build` always run content generation first. Never edit `public/assets/generated/` directly.

## Key conventions

- Angular components use the `.ts / .html / .scss` naming pattern (no `.component.` infix — Angular 21 default)
- All page routes are lazy-loaded via `loadComponent` in `src/app/app.routes.ts`
- Services are `providedIn: 'root'` and injected with `inject()`
- Signals (`signal()`, `signal.set()`, `signal.update()`) are preferred over plain class properties for mutable state
- Global SCSS lives in `src/styles/` (partials imported via `src/styles.scss`)
- CSS custom properties (defined in `src/styles/_variables.scss`) carry the design tokens — avoid hardcoded values in component SCSS

## Adding content

| Content type | Edit this file | Add assets here |
|---|---|---|
| Experience | `content/experience/experience.json` | — |
| Education | `content/education/education.json` | — |
| Photography | `content/photography/photos.json` | `public/assets/photography/` |
| Blog post | `content/posts/YYYY-MM-DD-slug.md` | — |
| Site metadata | `content/site/metadata.json` | — |

See `src/app/core/models/` for the TypeScript interfaces each content type must satisfy.

## Models (quick reference)

`ExperienceEntry` — `id, organization, role, location, startDate, endDate|null, description, highlights[], tags[]`

`EducationEntry` — `id, institution, degree, field, location, startDate, endDate|null, description, highlights[]`

`Photo` — `id, filename, title, caption, camera, film, location, date, tags[]`

`BlogPost` — `slug, title, date, summary, tags[], published, content` (content = rendered HTML)

`SiteMetadata` — `name, tagline, description, author, email, links{github?,linkedin?,twitter?}`

## Assets

Static assets served from `public/`. Generated JSON goes to `public/assets/generated/`. Photograph image files go to `public/assets/photography/`.

## Build output

`dist/portfolio/browser/` — deploy this directory to GitHub Pages.
