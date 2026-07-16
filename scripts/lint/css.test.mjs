import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findBannedPatterns, findDisallowedColors, lintCss, ALLOWED_HEXES } from './css.mjs';

test('the allowlist is exactly the four tokens', () => {
  assert.deepEqual([...ALLOWED_HEXES].sort(), ['#0f0e0c', '#2a2724', '#8a857c', '#e8e4dc']);
});

test('findBannedPatterns catches gradients', () => {
  const v = findBannedPatterns('.a{background:linear-gradient(90deg,#0f0e0c,#e8e4dc)}');
  assert.equal(v.length, 1);
  assert.equal(v[0].pattern, 'linear-gradient');
});

test('findBannedPatterns catches radial-gradient and backdrop-filter', () => {
  assert.equal(findBannedPatterns('.a{background:radial-gradient(#fff,#000)}').length, 1);
  assert.equal(findBannedPatterns('.a{backdrop-filter:blur(8px)}').length, 1);
});

test('findBannedPatterns is clean on compliant css', () => {
  assert.deepEqual(findBannedPatterns('.a{color:var(--fg);border-top:1px solid var(--rule)}'), []);
});

test('findDisallowedColors flags purple as purple', () => {
  const v = findDisallowedColors('.a{color:#8B5CF6}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

test('findDisallowedColors flags off-token colors', () => {
  const v = findDisallowedColors('.a{color:#ff0000}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'off-token');
});

test('findDisallowedColors permits the four tokens', () => {
  const css = '.a{color:#E8E4DC;background:#0F0E0C;border-color:#2A2724;outline-color:#8A857C}';
  assert.deepEqual(findDisallowedColors(css), []);
});

test('lintCss permits keywords and var() references', () => {
  const css = '.a{color:var(--fg);background:transparent;border-color:currentColor;fill:inherit}';
  assert.deepEqual(lintCss(css).violations, []);
});

test('lintCss reports every violation, not just the first', () => {
  const css = '.a{background:linear-gradient(#8B5CF6,#6366F1);backdrop-filter:blur(2px)}';
  const { violations } = lintCss(css);
  // 1 gradient + 1 backdrop-filter + 2 purples
  assert.equal(violations.length, 4);
});
