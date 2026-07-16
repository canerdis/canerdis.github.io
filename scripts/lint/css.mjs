import { findColorLiterals, findFunctionalColors, findNamedPurples, isPurple } from './colors.mjs';

// The four tokens from src/styles/tokens.css, normalized.
export const ALLOWED_HEXES = ['#0f0e0c', '#e8e4dc', '#8a857c', '#2a2724'];

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
    if (ALLOWED_HEXES.includes(hex)) continue;
    out.push({ hex, reason: isPurple(hex) ? 'purple' : 'off-token' });
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
        : `color ${hex} is not one of the four tokens (${ALLOWED_HEXES.join(', ')})`
    );
  }
  return { violations };
}
