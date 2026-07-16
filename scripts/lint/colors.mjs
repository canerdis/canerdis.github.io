// 8-digit before 6-digit before 4-digit before 3-digit: alternation is tried
// left-to-right at each position, so listing the longest forms first means a
// full #RRGGBBAA or #RGBA literal is matched whole instead of the scanner
// stopping short at its first 6 (or 3) hex digits and leaving the alpha
// nibble(s) dangling as unmatched text.
const HEX_RE = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;

export function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(input.trim());
  if (!m) return null;
  let h = m[1].toLowerCase();
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  // h is now 6 (RRGGBB) or 8 (RRGGBBAA) digits. Drop any alpha channel: an
  // alpha-hex color is checked against the allowlist/purple test using its
  // RGB channel only, same as its opaque equivalent.
  return '#' + h.slice(0, 6);
}

export function hexToHsl(hex) {
  const n = normalizeHex(hex);
  if (!n) throw new Error(`not a hex color: ${hex}`);
  const r = parseInt(n.slice(1, 3), 16) / 255;
  const g = parseInt(n.slice(3, 5), 16) / 255;
  const b = parseInt(n.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

// Purple/violet/indigo per the spec: hue 235-300 at saturation >15%.
// Lower bound is 235, not 240, so canonical indigo (#6366F1, ~238.7 deg)
// is caught while true blue (#3B82F6, ~217 deg) stays outside.
// The saturation gate exists so near-neutrals sitting at a purple hue
// are not flagged — otherwise a warm grey could fail the build.
export function isPurple(hex) {
  const { h, s } = hexToHsl(hex);
  return h >= 235 && h <= 300 && s > 15;
}

export function findColorLiterals(css) {
  return (css.match(HEX_RE) ?? []).map(normalizeHex).filter(Boolean);
}

function toHexByte(n) {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, '0');
}

export function rgbToHex(r, g, b) {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = s / 100;
  l = l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function hslToHex(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// Matches rgb()/rgba() with either comma- or space-separated channels, and
// either a comma- or slash-separated alpha component. Alpha is captured but
// discarded — same "check the RGB, ignore transparency" rule as alpha-hex.
const RGB_FUNC_RE =
  /\brgba?\(\s*(\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)\s*(?:[,/]\s*[\d.]+%?\s*)?\)/gi;

// Same comma/space + comma/slash-alpha flexibility as rgb(), for hsl()/hsla().
const HSL_FUNC_RE =
  /\bhsla?\(\s*(-?\d{1,3}(?:\.\d+)?)(?:deg)?\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)%\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)%\s*(?:[,/]\s*[\d.]+%?\s*)?\)/gi;

export function findFunctionalColors(css) {
  const out = [];
  for (const m of css.matchAll(RGB_FUNC_RE)) {
    out.push(rgbToHex(Number(m[1]), Number(m[2]), Number(m[3])));
  }
  for (const m of css.matchAll(HSL_FUNC_RE)) {
    out.push(hslToHex(Number(m[1]), Number(m[2]), Number(m[3])));
  }
  return out;
}

// Denylist of named CSS colors in the purple/violet/magenta family. This is
// intentionally NOT the full 147-name CSS color list — validating every
// named color against the allowlist risks flagging non-color identifiers
// that happen to share a word with a CSS keyword. Only this narrow purple
// family is checked by name.
export const PURPLE_NAMED = [
  'rebeccapurple',
  'mediumvioletred',
  'mediumorchid',
  'darkorchid',
  'blueviolet',
  'darkviolet',
  'darkmagenta',
  'mediumpurple',
  'fuchsia',
  'magenta',
  'orchid',
  'violet',
  'indigo',
  'purple',
];

export function findNamedPurples(css) {
  // Require the name to stand alone: not preceded/followed by a word
  // character or hyphen. That keeps `.violet-box{...}` (a selector) and
  // `mediumvioletred` (its own, separately-listed entry) from producing a
  // spurious match on the substring "violet".
  const re = new RegExp(`(?<![\\w-])(${PURPLE_NAMED.join('|')})(?![\\w-])`, 'gi');
  const out = [];
  for (const m of css.matchAll(re)) out.push(m[1].toLowerCase());
  return out;
}
