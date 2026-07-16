const HEX_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

export function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(input.trim());
  if (!m) return null;
  let h = m[1].toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return '#' + h;
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
