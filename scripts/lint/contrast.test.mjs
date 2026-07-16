import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio } from './contrast.mjs';

test('contrastRatio returns 21 for black on white', () => {
  assert.equal(Math.round(contrastRatio('#ffffff', '#000000') * 100) / 100, 21);
});

test('contrastRatio is symmetric', () => {
  assert.equal(contrastRatio('#e8e4dc', '#0f0e0c'), contrastRatio('#0f0e0c', '#e8e4dc'));
});

test('text tokens pass WCAG AA on the background', () => {
  // Verified values from the spec.
  assert.ok(contrastRatio('#e8e4dc', '#0f0e0c') >= 4.5); // ~15.22:1
  assert.ok(contrastRatio('#8a857c', '#0f0e0c') >= 4.5); // ~5.26:1
});

test('computed ratios match the spec figures', () => {
  assert.equal(Math.round(contrastRatio('#e8e4dc', '#0f0e0c') * 100) / 100, 15.22);
  assert.equal(Math.round(contrastRatio('#8a857c', '#0f0e0c') * 100) / 100, 5.26);
});
