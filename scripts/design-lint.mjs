#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { lintCss } from './lint/css.mjs';
import { contrastRatio } from './lint/contrast.mjs';

const DIST = 'dist';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const failures = [];

// 1. Scan every built stylesheet. astro.config sets inlineStylesheets:'never',
//    so all CSS lands in .css files — nothing hides in <style> tags.
let files;
try {
  files = (await walk(DIST)).filter((f) => extname(f) === '.css');
} catch {
  console.error(`design-lint: ${DIST}/ not found. Run \`npm run build\` first.`);
  process.exit(1);
}

if (files.length === 0) {
  console.error('design-lint: no CSS found in dist/. Refusing to pass vacuously.');
  process.exit(1);
}

for (const f of files) {
  const { violations } = lintCss(await readFile(f, 'utf8'));
  for (const v of violations) failures.push(`${f}: ${v}`);
}

// 2. Text tokens must clear WCAG AA against the background.
const BG = '#0f0e0c';
for (const [name, hex] of [['--fg', '#e8e4dc'], ['--muted', '#8a857c']]) {
  const r = contrastRatio(hex, BG);
  if (r < 4.5) failures.push(`contrast: ${name} (${hex}) on ${BG} is ${r.toFixed(2)}:1, needs >= 4.5:1`);
}

if (failures.length) {
  console.error(`\ndesign-lint FAILED with ${failures.length} violation(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('\nThe interface is monochrome: color is reserved for data.\n');
  process.exit(1);
}

console.log(`design-lint passed: ${files.length} stylesheet(s) clean, contrast verified.`);
