# haygenwarren.github.io

Personal portfolio for Haygen Warren — physics student, researcher, and film photographer.

Built with Angular 21, TypeScript, SCSS, and a file-based content workflow.

The homepage is a personal observatory: six destinations orbit a central portrait over a pixel-art deep field. The detail pages retain their reading layouts in a shared dark palette. Graphics are drawn locally with canvas and SVG; fonts use the system sans family.

On the first visit to Home in a page session, one of four short arrivals plays: radio telescope, film camera, rocket launch, or colliding neutron stars. The sequence advances on each full visit and can be replayed from the homepage. Visitors can skip it or press Escape. Reduced-motion preferences skip arrivals and stop the background and orbital motion; the manual pause preference is saved locally. Orbits also pause while visitors hover or focus the navigation.

Résumé / CV opens a native dialog with email and message fields. Submitting opens a prefilled email draft to Haygen; the visitor sends it in their own email app. The site does not send email or store requests.

---

## Architecture

The site separates content from presentation. Source content lives in `content/` as structured data files and Markdown. A Node.js script processes that content into JSON assets that Angular consumes at runtime via HTTP. No backend is required.

```
content/          Source content (checked into git)
  experience/     experience.json
  education/      education.json
  photography/    photos.json
  posts/          *.md  (Markdown with YAML front matter)
  site/           metadata.json

scripts/
  generate-content.js   Reads content/ → writes public/assets/generated/

public/
  assets/
    generated/    Output JSON (regenerated on every build — do not edit directly)
    photography/  Photograph image files

src/
  app/
    core/
      models/     TypeScript interfaces (ExperienceEntry, BlogPost, etc.)
      services/   Angular services that fetch generated JSON via HttpClient
      components/
        header/   Sticky nav header with responsive hamburger
        footer/
    shared/
      components/ Reusable UI components (future)
    pages/        One directory per route, lazy-loaded
      home/
      experience/
      education/
      photography/
      blog/
        blog-index/
        blog-post/
      about/
  styles/         Global SCSS partials (_variables, _base, _typography, _layout)
  styles.scss     Imports all partials
```

## Routes

| Path | Component |
|---|---|
| `/` | Home |
| `/experience` | Work Experience |
| `/research` | Research |
| `/education` | Education |
| `/photography` | Film Photography |
| `/blog` | Blog index |
| `/blog/:slug` | Individual blog post |
| `/about` | About |

All page routes are lazy-loaded.

---

## Development commands

```bash
npm start         # Generate content + serve with live reload (http://localhost:4200)
npm run build     # Generate content + production build → dist/portfolio/
npm run generate  # Re-run content generation only
```

Angular is configured for development mode on `npm start`. The production build runs automatically with `npm run build`.

---

## Adding and updating content

### Experience

Edit `content/experience/experience.json`. Each entry follows the `ExperienceEntry` interface:

```json
{
  "id": "unique-id",
  "category": "work",
  "organization": "Organization Name",
  "role": "Role Title",
  "location": "City, State",
  "startDate": "Mon YYYY",
  "endDate": null,
  "description": "One or two sentence description.",
  "highlights": ["Highlight one", "Highlight two"],
  "tags": ["tag1", "tag2"]
}
```

Set `endDate` to `null` for a current position. Use `category: "research"` for entries on the Research page and `category: "work"` for Work.

### Education

Edit `content/education/education.json`. Each entry follows the `EducationEntry` interface.

### Photography

Edit `content/photography/photos.json` to add photo metadata. Place image files in `public/assets/photography/`. The `filename` field should match the image filename.

### Blog posts

Create a new Markdown file in `content/posts/` named `YYYY-MM-DD-slug.md`. The filename becomes the URL slug. Front matter fields:

```yaml
---
title: "Post Title"
date: "YYYY-MM-DD"
summary: "One-sentence description shown on the index."
tags: ["tag1", "tag2"]
published: true
---

Post body in Markdown...
```

Set `published: false` to draft a post without it appearing on the site.

---

## How content generation works

`scripts/generate-content.js` runs automatically before `ng serve` and `ng build`. It:

1. Reads structured JSON files from `content/` and passes them through to `public/assets/generated/`
2. Reads each `.md` file in `content/posts/`, parses YAML front matter with `gray-matter`, renders the Markdown body to HTML with `marked`, and writes `public/assets/generated/posts.json`

Angular services (`ExperienceService`, `BlogService`, etc.) fetch these JSON files via `HttpClient` and expose them to page components via RxJS Observables.

---

## Deployment

Pushing to `main` deploys automatically via GitHub Pages. The deployment workflow copies `index.html` to `404.html` so direct links can load Angular routes.
