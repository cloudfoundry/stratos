// A runtime copy of the theme builder's light-to-dark derivation, for brand
// colors an operator sets in company-config.json. Copied from
// tools/stb/src/color/{derive-dark,oklch,contrast}.ts (foreground role only).
interface Oklch {
  l: number;
  c: number;
  h: number;
}

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(x => parseInt(x + x, 16)) : [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return [n[0] / 255, n[1] / 255, n[2] / 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function toOklch(hex: string): Oklch {
  const [sr, sg, sb] = hexToRgb(hex);
  const r = srgbToLinear(sr);
  const g = srgbToLinear(sg);
  const b = srgbToLinear(sb);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) {
    h += 360;
  }
  return { l: L, c: Math.hypot(A, B), h };
}

function oklchToHex(o: Oklch): string {
  const hr = (o.h * Math.PI) / 180;
  const A = o.c * Math.cos(hr);
  const B = o.c * Math.sin(hr);
  const l = (o.l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (o.l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (o.l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return rgbToHex(
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s));
}

// WCAG relative luminance of #rgb or #rrggbb; null for any other color syntax.
export function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) {
    return null;
  }
  const h = m[1].length === 3 ? m[1].replace(/./g, c => c + c) : m[1];
  const [r, g, b] = [0, 2, 4].map(i => srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a)!, luminance(b)!].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Dark surface the derived colors sit on: --app-bg of the .dark-theme block in
// styles/main.scss, as the same oklch literal (the stylesheet is not read).
const DARK_SURFACE = oklchToHex({ l: 0.20768, c: 0.0398, h: 265.75 });
const TARGET_RATIO = 4.5;

// A dark-mode value for a light #rgb/#rrggbb brand color: same hue and chroma,
// lightness stepped until it reads at 4.5:1 on the dark surface. Null for any
// other color syntax.
export function deriveDarkHex(light: string): string | null {
  if (luminance(light) === null) {
    return null;
  }
  const { l: l0, c, h } = toOklch(light);
  const at = (l: number) => oklchToHex({ l, c, h });
  let l = Math.max(l0, 0.7);
  for (let i = 0; i < 60 && contrast(at(l), DARK_SURFACE) < TARGET_RATIO && l < 1; i++) {
    l = Math.min(1, l + 0.02);
  }
  return at(l);
}
