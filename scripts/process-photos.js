// @ts-check
'use strict';

/**
 * Prepares photographs for the site: `npm run photos`.
 *
 * Reads full-resolution scans from photography_portfolio_images/ (kept out of
 * git), writes web-sized copies to public/assets/photography/, and records each
 * photo in content/photography/photos.json. Details come from the filename:
 *
 *   <film>_<location>_<camera>_<date>[_<n>].jpg
 *   e.g. P400_GreenBank_hasselblad501c_0826_2.jpg
 *
 * Dates may be MMYY (0826), or a month name and year (august2026, dec2023).
 * Short codes are expanded with the tables below; add a line there when you
 * shoot a new film or camera or visit a new place. Unknown codes still work
 * (they are spaced out from camelCase) but print a warning.
 *
 * Re-running is cheap: unchanged scans are skipped, and hand-written `alt`
 * text in photos.json is kept.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'photography_portfolio_images');
const OUTPUT_DIR = path.join(ROOT, 'public', 'assets', 'photography');
const THUMB_DIR = path.join(OUTPUT_DIR, 'thumbs');
const CONTENT_FILE = path.join(ROOT, 'content', 'photography', 'photos.json');

const LARGE_EDGE = 2048; // longest edge of the full-size view
const THUMB_WIDTH = 800; // grid image width (about 2× a grid column)

// Keys are lowercase filename codes.
const FILMS = {
  gold200: 'Kodak Gold 200',
  p400: 'Kodak Portra 400',
  tmax400: 'Kodak T-Max 400',
  hp5: 'Ilford HP5 Plus',
  phoenix200: 'Harman Phoenix 200',
  redscale200: 'Redscale 200',
  rolleiir: 'Rollei Infrared 400',
  cinestill50d: 'CineStill 50D',
  cinestill800t: 'CineStill 800T',
  cinestillbwxx: 'CineStill BwXX',
};
const BLACK_AND_WHITE = new Set(['tmax400', 'hp5', 'rolleiir', 'cinestillbwxx']);

const CAMERAS = {
  canonae1program: { name: 'Canon AE-1 Program', format: '35mm' },
  hasselblad501c: { name: 'Hasselblad 501C', format: 'medium format' },
  pentax67ii: { name: 'Pentax 67II', format: 'medium format' },
};

const PLACES = {
  durhamnc: 'Durham, NC',
  faisonnc: 'Faison, NC',
  fancygap: 'Fancy Gap, VA',
  greenbank: 'Green Bank, WV',
  greenbankwv: 'Green Bank, WV',
  greebankwv: 'Green Bank, WV', // as spelled in some filenames
  losangeles: 'Los Angeles, CA',
  outerbanksnc: 'Outer Banks, NC',
  peaislandnc: 'Pea Island, NC',
  washingtondc: 'Washington, D.C.',
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "NewFilm400" → "New Film 400", for codes missing from the tables. */
function humanize(code) {
  return code
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

function lookup(table, code, kind, file) {
  const hit = table[code.toLowerCase()];
  if (hit) return hit;
  console.warn(`  ! ${file}: unknown ${kind} "${code}" — add it to scripts/process-photos.js`);
  return null;
}

/** "0826" → "2026-08"; "august2026" / "dec2023" → "2026-08" / "2023-12". */
function parseDate(code, file) {
  let match = code.match(/^(\d{2})(\d{2})$/);
  if (match && +match[1] >= 1 && +match[1] <= 12) return `20${match[2]}-${match[1]}`;
  match = code.toLowerCase().match(/^([a-z]+)(\d{4})$/);
  const month = match ? MONTHS.indexOf(match[1].slice(0, 3)) : -1;
  if (match && month >= 0) return `${match[2]}-${String(month + 1).padStart(2, '0')}`;
  throw new Error(`${file}: cannot read the date "${code}" (use MMYY or e.g. august2026)`);
}

function describe(file) {
  const stem = path.basename(file, path.extname(file));
  const parts = stem.split('_');
  if (parts.length < 4) {
    throw new Error(`${file}: expected <film>_<location>_<camera>_<date>[_<n>]`);
  }
  const [filmCode, placeCode, cameraCode, dateCode] = parts;
  const camera = lookup(CAMERAS, cameraCode, 'camera', file);
  const filmKey = filmCode.toLowerCase();
  return {
    id: stem.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    film: lookup(FILMS, filmCode, 'film', file) ?? humanize(filmCode),
    location: lookup(PLACES, placeCode, 'location', file) ?? humanize(placeCode),
    camera: camera?.name ?? humanize(cameraCode),
    date: parseDate(dateCode, file),
    tags: [
      camera?.format,
      filmKey === 'rolleiir'
        ? 'infrared'
        : BLACK_AND_WHITE.has(filmKey)
          ? 'black and white'
          : 'color',
    ].filter(Boolean),
  };
}

/** Write `out` unless it is already newer than `source`. */
async function render(source, out, resize, quality) {
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(source).mtimeMs) return;
  // Metadata (camera EXIF, any GPS position) is stripped by default.
  await sharp(source, { limitInputPixels: false })
    .rotate()
    .resize({ ...resize, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toFile(out);
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`No ${path.relative(ROOT, SOURCE_DIR)}/ folder found.`);
    process.exit(1);
  }
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  const previous = fs.existsSync(CONTENT_FILE)
    ? JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8')).photos
    : [];
  const kept = new Map(previous.map((photo) => [photo.id, photo]));

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort();
  console.log(`Processing ${files.length} photograph(s)...\n`);

  const photos = [];
  for (const file of files) {
    const info = describe(file);
    const source = path.join(SOURCE_DIR, file);
    const filename = `${info.id}.jpg`;
    await render(
      source,
      path.join(OUTPUT_DIR, filename),
      { width: LARGE_EDGE, height: LARGE_EDGE, fit: 'inside' },
      82,
    );
    await render(source, path.join(THUMB_DIR, filename), { width: THUMB_WIDTH }, 78);
    const { width = 0, height = 0 } = await sharp(path.join(OUTPUT_DIR, filename)).metadata();
    photos.push({
      id: info.id,
      filename,
      thumbnail: `thumbs/${filename}`,
      width,
      height,
      alt: kept.get(info.id)?.alt || `Film photograph taken in ${info.location} on ${info.film}.`,
      camera: info.camera,
      film: info.film,
      location: info.location,
      date: info.date,
      tags: info.tags,
    });
    console.log(`  ✓ ${file}`);
  }

  // Remove web copies of scans that have been deleted from the source folder.
  const current = new Set(photos.map((photo) => photo.id));
  for (const photo of previous) {
    if (current.has(photo.id)) continue;
    for (const out of [
      path.join(OUTPUT_DIR, photo.filename ?? ''),
      path.join(OUTPUT_DIR, photo.thumbnail ?? ''),
    ]) {
      if (photo.filename && fs.existsSync(out) && fs.statSync(out).isFile()) fs.rmSync(out);
    }
    console.log(`  – removed ${photo.id}`);
  }

  // Newest first; photos from the same month keep their filename order.
  photos.sort((a, b) => b.date.localeCompare(a.date));
  fs.writeFileSync(CONTENT_FILE, JSON.stringify({ photos }, null, 2) + '\n', 'utf-8');
  console.log(`\nWrote ${path.relative(ROOT, CONTENT_FILE)} (${photos.length} photographs).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
