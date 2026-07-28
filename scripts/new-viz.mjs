#!/usr/bin/env node
/**
 * Add a visualisation to the gallery in one command.
 *
 * Copies the image into src/assets/viz/ and writes the matching content entry,
 * so the two never drift apart. Everything the schema requires is checked here
 * with a readable message, rather than failing later inside the build.
 *
 *   node scripts/new-viz.mjs \
 *     --image "C:/path/to/chart.png" \
 *     --slug   unemployment-map \
 *     --title  "Where unemployment is rising" \
 *     --date   2026-08-01 \
 *     --summary "One sentence for the gallery tile." \
 *     --alt    "What the chart shows, for someone who cannot see it." \
 *     --source "Eurostat · Europe Magazine" \
 *     --tools  "Python,Flourish" \
 *     --published --featured \
 *     --link   "https://www.instagram.com/p/..." \
 *     --gallery "page2.png,page3.png" \
 *     --gallery-alt "Second page description|Third page description"
 *
 * Then write the body: the file opens with a TODO line where the write-up goes.
 */
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { extname, basename, join, resolve } from 'node:path';

const ASSETS = 'src/assets/viz';
const CONTENT = 'src/content/viz';

// ── args ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flags = new Set(['published', 'featured', 'force', 'no-writeup']);
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) die(`unexpected argument: ${a}`);
  const key = a.slice(2);
  if (flags.has(key)) { opts[key] = true; continue; }
  const val = argv[++i];
  if (val === undefined || val.startsWith('--')) die(`--${key} needs a value`);
  opts[key] = val;
}

function die(msg) {
  console.error(`\nnew-viz: ${msg}\n`);
  process.exit(1);
}

// ── validation ────────────────────────────────────────────────────────────────
const required = ['image', 'slug', 'title', 'date', 'summary', 'alt'];
const missing = required.filter((k) => !opts[k]);
if (missing.length) {
  die(`missing required option(s): ${missing.map((m) => '--' + m).join(', ')}\n` +
      `       every one of these is required by the content schema; --alt in\n` +
      `       particular is what lets the chart describe itself when the image\n` +
      `       fails to load or is read aloud.`);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(opts.slug)) {
  die(`--slug must be lowercase words joined by hyphens (got "${opts.slug}")\n` +
      `       it becomes the page URL: /visualizations/${opts.slug}`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) die(`--date must be YYYY-MM-DD (got "${opts.date}")`);
if (Number.isNaN(Date.parse(opts.date))) die(`--date is not a real date: ${opts.date}`);
if (!existsSync(opts.image)) die(`image not found: ${opts.image}`);

const ext = extname(opts.image).toLowerCase();
if (!['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
  die(`unsupported image type "${ext}" — use png, jpg, svg or webp`);
}

const entryPath = join(CONTENT, `${opts.slug}.md`);
if (existsSync(entryPath) && !opts.force) {
  die(`${entryPath} already exists. Pass --force to overwrite it.`);
}

// ── extra carousel pages ──────────────────────────────────────────────────────
const galleryFiles = (opts.gallery || '').split(',').map((s) => s.trim()).filter(Boolean);
const galleryAlts = (opts['gallery-alt'] || '').split('|').map((s) => s.trim()).filter(Boolean);
if (galleryFiles.length !== galleryAlts.length) {
  die(`--gallery has ${galleryFiles.length} image(s) but --gallery-alt has ${galleryAlts.length}\n` +
      `       every extra image needs its own description. Separate images with\n` +
      `       commas and descriptions with | (pipes).`);
}
for (const g of galleryFiles) if (!existsSync(g)) die(`gallery image not found: ${g}`);

// ── copy images ───────────────────────────────────────────────────────────────
mkdirSync(ASSETS, { recursive: true });
const mainName = `${opts.slug}${ext}`;
copyFileSync(opts.image, join(ASSETS, mainName));
const copied = [mainName];

const galleryNames = galleryFiles.map((g, i) => {
  const name = `${opts.slug}-${i + 2}${extname(g).toLowerCase()}`;
  copyFileSync(g, join(ASSETS, name));
  copied.push(name);
  return name;
});

// ── write the entry ───────────────────────────────────────────────────────────
const yaml = (s) => `>-\n  ${String(s).trim().replace(/\s+/g, ' ')}`;
const tools = (opts.tools || '').split(',').map((t) => t.trim()).filter(Boolean);

const front = [
  '---',
  `title: ${opts.title}`,
  `date: ${opts.date}`,
  `summary: ${yaml(opts.summary)}`,
  `chart: ../../assets/viz/${mainName}`,
  `alt: ${yaml(opts.alt)}`,
  ...(opts.source ? [`source: ${opts.source}`] : []),
  ...(tools.length ? [`tools: [${tools.join(', ')}]`] : []),
  `writeup: ${opts['no-writeup'] ? 'false' : 'true'}`,
  `featured: ${opts.featured ? 'true' : 'false'}`,
  ...(opts.published ? ['published: true'] : []),
  ...(opts.link ? [`instagram: ${opts.link}`] : []),
  ...(galleryNames.length
    ? ['gallery:', ...galleryNames.map((n) => `  - ../../assets/viz/${n}`),
       'galleryAlt:', ...galleryAlts.map((a) => `  - ${yaml(a).replace('>-\n  ', '>-\n    ')}`)]
    : []),
  '---',
  '',
  opts['no-writeup']
    ? '<!-- writeup: false — this entry has no detail page, so no body is needed. -->'
    : 'TODO: the write-up. What the chart shows, why it was worth making, and what\nthe reader should take from it. Delete this line before publishing.',
  '',
].join('\n');

writeFileSync(entryPath, front, 'utf8');

// ── report ────────────────────────────────────────────────────────────────────
console.log(`\nwrote ${entryPath}`);
for (const c of copied) console.log(`      ${join(ASSETS, c)}`);
if (!opts['no-writeup']) {
  console.log(`\nnext: open ${entryPath} and replace the TODO line with the write-up.`);
}
console.log(`then: npm run build && npm run lint:design && npm run verify\n`);
