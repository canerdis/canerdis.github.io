import { readFileSync } from 'node:fs';
import { findColorLiterals, findFunctionalColors, findNamedPurples, isPurple, normalizeHex } from './colors.mjs';

// The colour tokens, read from src/styles/tokens.css so the lint and the
// stylesheet cannot drift apart: a colour is allowed exactly when it is
// defined there as a custom property.
const TOKENS = new URL('../../src/styles/tokens.css', import.meta.url);
export const ALLOWED_HEXES = [
  ...readFileSync(TOKENS, 'utf8').matchAll(/--[\w-]+\s*:\s*(#[0-9a-fA-F]{3,8})/g),
].map((m) => normalizeHex(m[1]));

// Keywords are permitted and are not hex literals, so they never reach the
// color check. Listed here for the reader: transparent, currentColor,
// inherit, initial, unset.

const BANNED = [
  { pattern: 'linear-gradient', re: /linear-gradient\s*\(/gi },
  { pattern: 'radial-gradient', re: /radial-gradient\s*\(/gi },
  { pattern: 'conic-gradient', re: /conic-gradient\s*\(/gi },
  { pattern: 'backdrop-filter', re: /backdrop-filter\s*:/gi },
];

export function findBannedPatterns(css) {
  const out = [];
  for (const { pattern, re } of BANNED) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(css)) !== null) {
      out.push({ pattern, snippet: css.slice(Math.max(0, m.index - 30), m.index + 40) });
    }
  }
  return out;
}

export function findDisallowedColors(css) {
  const out = [];
  // Hex literals (including alpha-hex, normalized to RGB) and functional
  // rgb()/hsl() notations (also normalized to RGB) are unambiguously colors,
  // so both are checked against the allowlist/purple test the same way.
  const hexes = [...findColorLiterals(css), ...findFunctionalColors(css)];
  for (const hex of hexes) {
    // Purple is checked first and on its own, so not even a token can be one.
    if (isPurple(hex)) out.push({ hex, reason: 'purple' });
    else if (!ALLOWED_HEXES.includes(hex)) out.push({ hex, reason: 'off-token' });
  }
  // Named purples are a denylist match, not a hex conversion: they're never
  // one of the four tokens, so they're always reported as purple.
  for (const name of findNamedPurples(css)) {
    out.push({ hex: name, reason: 'purple' });
  }
  return out;
}

export function lintCss(css) {
  const violations = [];
  for (const { pattern, snippet } of findBannedPatterns(css)) {
    violations.push(`banned pattern "${pattern}" near: ${snippet.trim()}`);
  }
  for (const { hex, reason } of findDisallowedColors(css)) {
    violations.push(
      reason === 'purple'
        ? `purple/violet/indigo is banned in the interface: ${hex}`
        : `color ${hex} is not one of the tokens in src/styles/tokens.css (${ALLOWED_HEXES.join(', ')})`
    );
  }
  return { violations };
}
