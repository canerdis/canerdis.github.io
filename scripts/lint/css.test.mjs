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

// --- Hole 1: alpha-hex must not bypass the allowlist/purple check. ---

test('findDisallowedColors flags 8-digit alpha-hex purple', () => {
  const v = findDisallowedColors('.a{color:#8b5cf6aa}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

test('findDisallowedColors treats a token color with an alpha channel as allowed', () => {
  assert.deepEqual(findDisallowedColors('.a{color:#0f0e0cff}'), []);
});

test('findDisallowedColors flags 8-digit alpha-hex indigo as purple', () => {
  const v = findDisallowedColors('.a{background:#6366f1ff}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

// --- Hole 2: functional rgb()/hsl() notations must be scanned. ---

test('findDisallowedColors flags rgb() purple (comma syntax)', () => {
  const v = findDisallowedColors('.a{background:rgb(120,40,200)}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

test('findDisallowedColors flags rgb() purple (space syntax)', () => {
  const v = findDisallowedColors('.a{background:rgb(120 40 200)}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

test('findDisallowedColors flags rgba() red as off-token, ignoring alpha', () => {
  const v = findDisallowedColors('.a{color:rgba(255,0,0,.6)}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'off-token');
});

test('findDisallowedColors flags plain rgb() red as off-token', () => {
  const v = findDisallowedColors('.a{color:rgb(255,0,0)}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'off-token');
});

test('findDisallowedColors flags hsl() purple', () => {
  const v = findDisallowedColors('.a{color:hsl(270,80%,50%)}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

test('findDisallowedColors flags hsla() purple (space + slash-alpha syntax)', () => {
  const v = findDisallowedColors('.a{color:hsla(270 80% 50% / .5)}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

// --- Hole 2: named CSS purples. ---

test('findDisallowedColors flags the named color purple', () => {
  const v = findDisallowedColors('.a{color:purple}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

test('findDisallowedColors flags rebeccapurple', () => {
  const v = findDisallowedColors('.a{background:rebeccapurple}');
  assert.equal(v.length, 1);
  assert.equal(v[0].reason, 'purple');
});

test('findDisallowedColors does not false-positive on a named-purple substring in an identifier', () => {
  // `.violet-box` is a selector, not a color value: "violet" is immediately
  // followed by "-", so it must not be treated as the named color violet.
  assert.deepEqual(findDisallowedColors('.violet-box{color:#0f0e0c}'), []);
});

// --- Regression guard: the hardened scanner must still pass clean CSS. ---

test('lintCss still permits keywords, var(), and the four raw tokens after hardening', () => {
  const css = '.a{color:var(--fg);background:transparent;border-color:currentColor}';
  assert.deepEqual(lintCss(css).violations, []);
  const tokens = '.b{color:#0f0e0c;background:#e8e4dc;border-color:#8a857c;outline-color:#2a2724}';
  assert.deepEqual(lintCss(tokens).violations, []);
});
