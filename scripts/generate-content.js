// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUTPUT_DIR = path.join(ROOT, 'public', 'assets', 'generated');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function readJson(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

/** Stops the build with a message saying what to fix. */
function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function writeJson(filename, data) {
  const dest = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ ${filename}`);
}

console.log('Generating content assets...\n');

// Site metadata — pass through as-is
const site = readJson(path.join(CONTENT_DIR, 'site', 'metadata.json'));
writeJson('site.json', site);

// Experience — written after resources below, which add file links to it
const experience = readJson(path.join(CONTENT_DIR, 'experience', 'experience.json'));

// Education — pass through as-is
const education = readJson(path.join(CONTENT_DIR, 'education', 'education.json'));
writeJson('education.json', education);

// Photography — pass through as-is
const photos = readJson(path.join(CONTENT_DIR, 'photography', 'photos.json'));
writeJson('photos.json', photos);

// Page banners — each page names a gallery photo (or a banner-only image);
// resolve it to image paths and alt text.
const photosById = new Map(photos.photos.map((photo) => [photo.id, photo]));
const banners = {};
for (const [page, banner] of Object.entries(
  readJson(path.join(CONTENT_DIR, 'site', 'banners.json')),
)) {
  const where = `content/site/banners.json, "${page}"`;
  const shared = { focus: banner.focus ?? '50% 50%', flip: banner.flip === true };
  if (banner.photo) {
    const photo = photosById.get(banner.photo);
    if (!photo) {
      fail(`${where}: no gallery photo "${banner.photo}". Use an id from content/photography/photos.json.`);
    }
    banners[page] = {
      src: `assets/photography/${photo.filename}`,
      srcset: `assets/photography/${photo.thumbnail} 800w, assets/photography/${photo.filename} ${photo.width}w`,
      alt: photo.alt,
      ...shared,
    };
  } else if (banner.image) {
    const bannersDir = path.join(ROOT, 'public', 'assets', 'banners');
    if (!fs.existsSync(path.join(bannersDir, banner.image))) {
      fail(
        `${where}: public/assets/banners/${banner.image} doesn't exist. ` +
          'Put the photo in photography_portfolio_images/banners/ and run `npm run photos`.',
      );
    }
    if (!banner.alt) fail(`${where}: add "alt", a short description of the photo for screen readers.`);
    const hasSmall = fs.existsSync(path.join(bannersDir, 'small', banner.image));
    banners[page] = {
      src: `assets/banners/${banner.image}`,
      ...(hasSmall && {
        srcset: `assets/banners/small/${banner.image} 800w, assets/banners/${banner.image} 2048w`,
      }),
      alt: banner.alt,
      ...shared,
    };
  } else {
    fail(`${where}: give either "photo" (a gallery photo id) or "image".`);
  }
}
writeJson('banners.json', banners);

// Resources — slides and posters (PDFs) in content/resources/, listed in its
// resources.json. Each PDF is copied to the site with a picture of its first
// page, and linked from the Research/Work entries and talks named in "related".
const RESOURCES_DIR = path.join(CONTENT_DIR, 'resources');
const PREVIEWS_DIR = path.join(RESOURCES_DIR, 'previews');
const RESOURCES_OUT = path.join(OUTPUT_DIR, 'resources');
fs.rmSync(RESOURCES_OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(RESOURCES_OUT, 'previews'), { recursive: true });

const formatSize = (bytes) =>
  bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;

/**
 * Renders page 1 of the PDF to content/resources/previews/<name>.jpg when it's
 * missing or older than the PDF (commit it), and copies it to the site.
 * Needs pdftoppm from Poppler; without it, an existing preview is reused.
 */
function preparePreview(pdf, stem) {
  const jpg = path.join(PREVIEWS_DIR, `${stem}.jpg`);
  if (!fs.existsSync(jpg) || fs.statSync(jpg).mtimeMs < fs.statSync(pdf).mtimeMs) {
    fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
    try {
      execFileSync(
        'pdftoppm',
        ['-jpeg', '-jpegopt', 'quality=82', '-f', '1', '-l', '1', '-singlefile', '-scale-to', '960', pdf, path.join(PREVIEWS_DIR, stem)],
        { stdio: 'pipe' },
      );
      console.log(`  ✓ resources/previews/${stem}.jpg`);
    } catch (err) {
      if (!fs.existsSync(jpg)) {
        console.warn(
          err.code === 'ENOENT'
            ? `  ! No preview for ${stem}.pdf: install Poppler (\`brew install poppler\`) and run again.`
            : `  ! Couldn't make a preview of ${stem}.pdf: ${String(err.stderr || err.message).trim()}`,
        );
      }
    }
  }
  if (!fs.existsSync(jpg)) return null;
  fs.copyFileSync(jpg, path.join(RESOURCES_OUT, 'previews', `${stem}.jpg`));
  return `assets/generated/resources/previews/${stem}.jpg`;
}

const resourcesFile = path.join(RESOURCES_DIR, 'resources.json');
const linkable = new Map([
  ...experience.entries.map((entry) => [entry.id, { item: entry, event: entry.organization }]),
  ...(experience.presentations ?? []).map((talk) => [talk.id, { item: talk, event: talk.conference }]),
]);
const resources = (fs.existsSync(resourcesFile) ? readJson(resourcesFile).resources : []).map(
  (resource) => {
    const where = `content/resources/resources.json, "${resource.file}"`;
    const pdf = path.join(RESOURCES_DIR, resource.file ?? '');
    if (!resource.file?.endsWith('.pdf') || !fs.existsSync(pdf)) {
      fail(`${where}: put the PDF in content/resources/ and give its filename as "file".`);
    }
    if (!resource.title) fail(`${where}: add a "title".`);
    if (!/^\d{4}-\d{2}$/.test(resource.date ?? '')) fail(`${where}: "date" should look like "2026-10".`);
    const kind = resource.kind ?? 'PDF';
    const href = `assets/generated/resources/${resource.file}`;
    fs.copyFileSync(pdf, path.join(RESOURCES_OUT, resource.file));

    const events = (resource.related ?? []).map((id) => {
      const found = linkable.get(id);
      if (!found) fail(`${where}: no entry or talk with id "${id}" in content/experience/experience.json.`);
      (found.item.files ??= []).push({ label: kind, href });
      return found.event;
    });
    return {
      title: resource.title,
      kind,
      date: resource.date,
      events: resource.events ?? [...new Set(events)],
      href,
      preview: preparePreview(pdf, path.basename(resource.file, '.pdf')),
      size: formatSize(fs.statSync(pdf).size),
    };
  },
);
resources.sort((a, b) => b.date.localeCompare(a.date));
writeJson('resources.json', { resources });
writeJson('experience.json', experience);

// Writing — published articles, newest first
const writing = readJson(path.join(CONTENT_DIR, 'writing', 'articles.json'));
writing.articles.sort((a, b) => String(b.date).localeCompare(String(a.date)));
writeJson('writing.json', writing);

// Blog posts — parse Markdown with front matter and render to HTML.
// The folder may not exist (git doesn't keep empty folders), meaning no posts.
const postsDir = path.join(CONTENT_DIR, 'posts');
const mdFiles = fs.existsSync(postsDir)
  ? fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith('.md'))
      .sort()
  : [];

const posts = mdFiles.map((filename) => {
  const slug = path.basename(filename, '.md');
  const raw = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
  const { data: fm, content } = matter(raw);

  return {
    slug,
    title: fm['title'] ?? slug,
    date: fm['date'] ?? '',
    summary: fm['summary'] ?? '',
    tags: fm['tags'] ?? [],
    published: fm['published'] ?? false,
    content: marked.parse(content),
  };
});

// Most-recent posts first
posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));

writeJson('posts.json', { posts });

console.log(`\nDone — ${posts.length} post(s) processed.`);
