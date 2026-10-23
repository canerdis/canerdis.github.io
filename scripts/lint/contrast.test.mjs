import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio } from './contrast.mjs';

test('contrastRatio returns 21 for black on white', () => {
  assert.equal(Math.round(contrastRatio('#ffffff', '#000000') * 100) / 100, 21);
});

test('contrastRatio is symmetric', () => {
  assert.equal(contrastRatio('#e4e7eb', '#0b0d10'), contrastRatio('#0b0d10', '#e4e7eb'));
});

test('text tokens pass WCAG AA on the background', () => {
  // Verified values from the spec.
  assert.ok(contrastRatio('#e4e7eb', '#0b0d10') >= 4.5); // ~15.69:1
  assert.ok(contrastRatio('#8a929c', '#0b0d10') >= 4.5); // ~6.18:1
});

test('computed ratios match the spec figures', () => {
  assert.equal(Math.round(contrastRatio('#e4e7eb', '#0b0d10') * 100) / 100, 15.69);
  assert.equal(Math.round(contrastRatio('#8a929c', '#0b0d10') * 100) / 100, 6.18);
});
