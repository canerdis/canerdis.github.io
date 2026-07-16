import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHex, hexToHsl, isPurple, findColorLiterals } from './colors.mjs';

test('normalizeHex expands shorthand and lowercases', () => {
  assert.equal(normalizeHex('#ABC'), '#aabbcc');
  assert.equal(normalizeHex('#0F0E0C'), '#0f0e0c');
  assert.equal(normalizeHex('transparent'), null);
  assert.equal(normalizeHex('#12345'), null);
});

test('hexToHsl computes known values', () => {
  const red = hexToHsl('#ff0000');
  assert.equal(Math.round(red.h), 0);
  assert.equal(Math.round(red.s), 100);
  const grey = hexToHsl('#808080');
  assert.equal(Math.round(grey.s), 0);
});

test('isPurple flags the vibe-coded purples', () => {
  // The two most common generated-site purples.
  assert.equal(isPurple('#8B5CF6'), true);  // violet-500
  assert.equal(isPurple('#6366F1'), true);  // indigo-500
});

test('isPurple does not flag the token palette', () => {
  assert.equal(isPurple('#0F0E0C'), false);
  assert.equal(isPurple('#E8E4DC'), false);
  assert.equal(isPurple('#8A857C'), false);
  assert.equal(isPurple('#2A2724'), false);
});

test('isPurple ignores desaturated colors in the purple hue range', () => {
  // A near-grey that technically sits at a purple hue is not "purple".
  // Saturation gate prevents false positives on warm/cool neutrals.
  assert.equal(isPurple('#807f82'), false);
});

test('findColorLiterals extracts hexes in source order', () => {
  const css = 'a{color:#FFF}b{background:#8B5CF6;border:1px solid #2A2724}';
  assert.deepEqual(findColorLiterals(css), ['#ffffff', '#8b5cf6', '#2a2724']);
});

// --- Hole 1: alpha-hex (#RGBA / #RRGGBBAA) must not bypass scanning. ---

test('normalizeHex drops the alpha channel from 4- and 8-digit hex', () => {
  assert.equal(normalizeHex('#6366f1ff'), '#6366f1');
  assert.equal(normalizeHex('#0f0e0cff'), '#0f0e0c');
  assert.equal(normalizeHex('#63f8'), '#6633ff'); // #RGBA shorthand, alpha 8->88 dropped
});

test('isPurple treats alpha-hex the same as its opaque RGB channel', () => {
  assert.equal(isPurple('#6366f1ff'), true); // indigo-500 + alpha, still purple
  assert.equal(isPurple('#0f0e0cff'), false); // token color + alpha, still not purple
});

test('findColorLiterals recognizes 4- and 8-digit hex and normalizes away the alpha channel', () => {
  const css = 'a{color:#6366f1ff}b{background:#0f0e0cff}c{outline:#63f8}';
  assert.deepEqual(findColorLiterals(css), ['#6366f1', '#0f0e0c', '#6633ff']);
});
