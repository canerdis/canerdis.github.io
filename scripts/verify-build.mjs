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

// 1. Required routes exist.
for (const route of ['index.html', '404.html', 'visualizations/index.html', 'data-science/index.html']) {
  if (!files.includes(join(DIST, route))) failures.push(`missing route: ${route}`);
}

// 2. Every <img> has non-empty alt text.
for (const f of files.filter((f) => extname(f) === '.html')) {
  const html = await readFile(f, 'utf8');
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    const alt = /\balt\s*=\s*"([^"]*)"/.exec(tag);
    if (!alt || alt[1].trim() === '') failures.push(`${f}: <img> with missing or empty alt`);
  }
}

// 3. Image weight budget: any single chart <= 150KB at 1x in AVIF.
const LIMIT = 150 * 1024;
for (const f of files.filter((f) => ['.avif', '.webp', '.png', '.jpg'].includes(extname(f)))) {
  const { size } = await stat(f);
  if (extname(f) === '.avif' && size > LIMIT) {
    failures.push(`${f}: ${(size / 1024).toFixed(0)}KB exceeds the 150KB AVIF budget`);
  }
}

// 4. No JavaScript shipped.
const js = files.filter((f) => extname(f) === '.js');
if (js.length) failures.push(`zero-JS violated: ${js.length} .js file(s) in dist (${js[0]})`);

// 5. Internal links resolve — CASE-SENSITIVELY.
//    This is the Windows trap: local dev is case-insensitive, GitHub Pages
//    serves from Linux and is not. A link to /Visualizations works on the
//    author's machine and 404s in production. The Set lookup below is
//    case-sensitive, so it catches that locally.
const present = new Set(files.map((f) => f.split('\\').join('/')));
const exists = (p) => present.has(p) || present.has(`${p}/index.html`);

for (const f of files.filter((f) => extname(f) === '.html')) {
  const html = await readFile(f, 'utf8');
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

// 6. Content budget: proxies for a layout constraint this script cannot
//    measure itself. The real constraint is that the first work row's
//    summary on the home page clears the fold at 1280x800 — these character
//    limits exist to catch a one-line content edit (a longer bio sentence,
//    a longer featured title) before it silently pushes that summary under
//    the fold. The numbers were measured against the home page at the point
//    this budget was added (2026-07-30); re-measure and update them if the
//    layout above the work list changes deliberately.
//
//    Only SITE.bio is checked here. The other two limits this finding asked
//    for — the newest featured viz/project entry's title and summary length
//    — need `getCollection`, which lives behind the `astro:content` virtual
//    module. That module only resolves inside Astro's Vite pipeline; this
//    script runs as plain Node (see the shebang) and `import('astro:content')`
//    fails here with "Only URLs with a scheme in: file, data, and node are
//    supported". Reading the markdown frontmatter directly would mean
//    reimplementing the schema in content.config.ts as a second loader, so
//    that part of the check is left undone rather than duplicated.
const { SITE } = await import('../src/config.ts');
const BIO_LIMIT = 340;
if (SITE.bio.length > BIO_LIMIT) {
  failures.push(`SITE.bio: ${SITE.bio.length} chars exceeds the ${BIO_LIMIT}-char budget that keeps the first work row's summary clear of the fold at 1280x800`);
}

if (failures.length) {
  console.error(`\nverify FAILED with ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('verify passed: routes present, alt text complete, image budget held, zero JS, links resolve, content budget held.');
