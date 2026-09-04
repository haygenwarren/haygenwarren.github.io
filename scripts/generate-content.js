// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUTPUT_DIR = path.join(ROOT, 'public', 'assets', 'generated');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function readJson(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
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

// Experience — pass through as-is
const experience = readJson(path.join(CONTENT_DIR, 'experience', 'experience.json'));
writeJson('experience.json', experience);

// Education — pass through as-is
const education = readJson(path.join(CONTENT_DIR, 'education', 'education.json'));
writeJson('education.json', education);

// Photography — pass through as-is
const photos = readJson(path.join(CONTENT_DIR, 'photography', 'photos.json'));
writeJson('photos.json', photos);

// Blog posts — parse Markdown with front matter and render to HTML
const postsDir = path.join(CONTENT_DIR, 'posts');
const mdFiles = fs
  .readdirSync(postsDir)
  .filter(f => f.endsWith('.md'))
  .sort();

const posts = mdFiles.map(filename => {
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
