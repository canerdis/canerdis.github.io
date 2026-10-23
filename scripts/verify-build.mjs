#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST = 'dist';
const failures = [];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

let files;
try {
  files = await walk(DIST);
} catch {
  console.error(`verify: ${DIST}/ not found. Run \`npm run build\` first.`);
  process.exit(1);
}

const htmlFiles = files.filter((f) => extname(f) === '.html');
const pages = await Promise.all(htmlFiles.map(async (f) => [f, await readFile(f, 'utf8')]));

// 1. Required routes exist. The two section indexes and the detail pages
//    under them are linked from outside the site (README files, LinkedIn
//    posts), so their URLs must keep working.
for (const route of ['index.html', '404.html', 'visualizations/index.html', 'data-science/index.html']) {
  if (!files.includes(join(DIST, route))) failures.push(`missing route: ${route}`);
}

// 2. Every <img> has alt text. An empty alt is allowed only on an image that
//    is also aria-hidden: a decorative copy of a picture whose meaning is
//    already in the text beside it (the latest-charts tiles, the hover
//    preview). Anywhere else an empty alt hides the content.
for (const [f, html] of pages) {
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    // Astro writes an empty alt as the bare attribute `alt`, which HTML reads
    // as alt="".
    const alt = /\salt(?:\s*=\s*"([^"]*)")?(?=[\s/>])/.exec(tag);
    if (!alt) failures.push(`${f}: <img> with no alt attribute`);
    else if (!(alt[1] ?? '').trim() && !/\baria-hidden\s*=\s*"true"/.test(tag)) {
      failures.push(`${f}: <img> with empty alt that is not marked aria-hidden`);
    }
  }
}

// 3. Every page has exactly one <h1>: the page's title.
for (const [f, html] of pages) {
  const n = (html.match(/<h1\b/g) ?? []).length;
  if (n !== 1) failures.push(`${f}: ${n} <h1> elements, expected 1`);
}

// 4. Image weight budget: nothing a page actually requests may exceed 150KB.
//    Scoped to referenced images on purpose. Astro also copies each source
//    original into _astro/ next to the resized variants, and those originals
//    are the heavy ones while no page links to them. `data-src` counts: the
//    hover preview fetches its pictures on the first hover.
const LIMIT = 150 * 1024;
const referenced = new Set();
for (const [, html] of pages) {
  for (const m of html.matchAll(/\b(?:src|srcset|data-src)\s*=\s*"([^"]*)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url.startsWith('/') && /\.(avif|webp|png|jpe?g)$/i.test(url)) {
        referenced.add(join(DIST, ...url.slice(1).split('/')));
      }
    }
  }
}
// A check that matches nothing must not pass: if the path joining ever
// breaks, the set is empty and every image would be skipped silently.
if (referenced.size === 0) failures.push('image budget: no referenced images found; refusing to pass vacuously');
for (const f of referenced) {
  if (!files.includes(f)) {
    failures.push(`${f}: referenced by a page but not in the build`);
    continue;
  }
  const { size } = await stat(f);
  if (size > LIMIT) failures.push(`${f}: ${(size / 1024).toFixed(0)}KB exceeds the 150KB budget`);
}

// 5. JavaScript budget. The site ships one small first-party module, the
//    motion layer in src/scripts/site.js; every page is complete HTML without
//    it. One file, under 12KB, and no script loaded from another origin.
const JS_LIMIT = 12 * 1024;
const js = files.filter((f) => extname(f) === '.js');
if (js.length > 1) failures.push(`JS budget: ${js.length} .js files in dist, expected at most 1 (${js.join(', ')})`);
for (const f of js) {
  const { size } = await stat(f);
  if (size > JS_LIMIT) failures.push(`${f}: ${(size / 1024).toFixed(1)}KB exceeds the 12KB JS budget`);
}
for (const [f, html] of pages) {
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*"([^"]+)"/g)) {
    if (/^(https?:)?\/\//.test(m[1])) failures.push(`${f}: third-party script ${m[1]}`);
  }
}

// 6. Internal links resolve — CASE-SENSITIVELY.
//    This is the Windows trap: local dev is case-insensitive, GitHub Pages
//    serves from Linux and is not. A link to /Visualizations works on the
//    author's machine and 404s in production. The Set lookup below is
//    case-sensitive, so it catches that locally.
const present = new Set(files.map((f) => f.split('\\').join('/')));
const exists = (p) => present.has(p) || present.has(`${p}/index.html`);

for (const [f, html] of pages) {
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*"([^"]+)"/g)) {
    const href = m[1];
    // Skip external, anchors, and non-http schemes (mailto:, tel:).
    if (/^(https?:)?\/\//.test(href) || href.startsWith('#') || /^[a-z]+:/i.test(href)) continue;
    if (!href.startsWith('/')) continue; // all internal links in this site are root-relative
    const clean = href.split('#')[0].split('?')[0];
    const target = join(DIST, clean).split('\\').join('/');
    if (!exists(target.replace(/\/$/, ''))) failures.push(`${f}: broken internal link -> ${href}`);
  }
}

// 7. The hero line stays short. It sits under the name at 46ch, and three
//    lines is the most it can take before the facts strip and the first
//    pictures are pushed off the first screen at 1440x900.
const { SITE } = await import('../src/config.ts');
const LINE_LIMIT = 140;
if (SITE.line.length > LINE_LIMIT) {
  failures.push(`SITE.line: ${SITE.line.length} chars exceeds the ${LINE_LIMIT}-char budget for the line under the name`);
}

if (failures.length) {
  console.error(`\nverify FAILED with ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `verify passed: routes present, alt text complete, one h1 per page, ${referenced.size} served images within budget, ` +
    `${js.length} script within budget, links resolve, hero line within budget.`,
);
