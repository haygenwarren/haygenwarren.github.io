# haygenwarren.github.io

Personal portfolio for Haygen Warren — physics student, researcher, and film photographer.

Built with Angular 21, TypeScript, SCSS, and a file-based content workflow.

The homepage is a personal observatory: seven destinations slowly orbit a stationary central portrait over a pixel-art deep field. The detail pages retain their reading layouts in a shared dark palette. Graphics are drawn locally with canvas and SVG; fonts use the system sans family.

On the first visit to Home in a page session, one of four short arrivals plays: radio telescope, film camera, rocket launch, or colliding neutron stars. The sequence advances on each full visit and can be replayed from the homepage. Visitors can skip it or press Escape. Reduced-motion preferences skip arrivals and stop the background and orbital motion; the manual pause preference is saved locally. The orbit also pauses while a visitor points at or keyboard-focuses a destination, so it is easy to click.

Résumé / CV on the homepage and "Let's connect" on the Photography page (commission enquiries) open the same native dialog (`shared/components/contact-request`) with email and message fields. Submitting opens a prefilled email draft to Haygen; the visitor sends it in their own email app. The site does not send email or store requests.

---

## Architecture

The site separates content from presentation. Source content lives in `content/` as structured data files and Markdown. A Node.js script processes that content into JSON assets that Angular consumes at runtime via HTTP. No backend is required.

```
content/          Source content (checked into git)
  experience/     experience.json
  education/      education.json
  photography/    photos.json  (written by `npm run photos`)
  posts/          *.md  (Markdown with YAML front matter)
  site/           metadata.json
  writing/        articles.json  (published articles shown on /writing)

scripts/
  generate-content.js   Reads content/ → writes public/assets/generated/

public/
  assets/
    generated/    Output JSON (regenerated on every build — do not edit directly)
    photography/  Web copies of photographs, plus thumbs/ for the grid

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
      writing/
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
| `/writing` | Writing (published articles) |
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
npm run photos    # Turn new photo scans into web images + photos.json
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

Put full-resolution scans in `photography_portfolio_images/` (git-ignored, since some scans exceed GitHub's 100 MB file limit) and run `npm run photos`. The script writes a 2048px copy and an 800px grid image for each scan to `public/assets/photography/`, strips camera and GPS metadata, and updates `content/photography/photos.json`. Commit those outputs.

Name each scan `<film>_<location>_<camera>_<date>[_<n>].jpg`, for example `P400_GreenBank_hasselblad501c_0826_2.jpg`. Dates can be `MMYY` (`0826`) or a month and year (`august2026`, `dec2023`). Short codes are expanded by the `FILMS`, `CAMERAS` and `PLACES` tables at the top of `scripts/process-photos.js`; add a line there for a new film, camera or place (unknown codes still work but print a warning).

The only field to edit by hand is `alt`, the description read by screen readers; re-running the script keeps it. Deleting a scan and re-running removes its web copies and entry.

### Writing

Edit `content/writing/articles.json` to list a published article on the Writing page. Each entry follows the `Article` interface; articles are sorted newest first during generation, so new entries can go anywhere in the list:

```json
{
  "id": "article-url-slug",
  "title": "Article headline",
  "url": "https://www.nasaspaceflight.com/YYYY/MM/article-url-slug/",
  "date": "YYYY-MM-DD",
  "publication": "NASASpaceflight.com",
  "topic": "Science",
  "summary": "The article's opening line."
}
```

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
2. Sorts `content/writing/articles.json` newest first and writes `public/assets/generated/writing.json`
3. Reads each `.md` file in `content/posts/`, parses YAML front matter with `gray-matter`, renders the Markdown body to HTML with `marked`, and writes `public/assets/generated/posts.json`

Angular services (`ExperienceService`, `BlogService`, etc.) fetch these JSON files via `HttpClient` and expose them to page components via RxJS Observables.

---

## Deployment

Pushing to `main` deploys automatically via GitHub Pages. The deployment workflow copies `index.html` to `404.html` so direct links can load Angular routes.
