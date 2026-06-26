// Björn Ottosson's sRGB <-> OKLab/OKLCH. l in 0..1, c in 0..~0.4, h in degrees.
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n =
    h.length === 3
      ? h.split('').map((x) => parseInt(x + x, 16))
      : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return [n[0]! / 255, n[1]! / 255, n[2]! / 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function toOklch(hex: string): Oklch {
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
  const c = Math.hypot(A, B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

export function oklchToHex(o: Oklch): string {
  const hr = (o.h * Math.PI) / 180;
  const A = o.c * Math.cos(hr);
  const B = o.c * Math.sin(hr);
  const l = (o.l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (o.l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (o.l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const r = linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const b = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return rgbToHex(r, g, b);
}

// ponytail: fixed lightness ramp, constant chroma. Tuning knob: taper chroma at
// the light/dark ends and run a contrast pass once the a11y milestone lands.
const SCALE_LIGHTNESS: Record<string, number> = {
  '50': 0.97, '100': 0.93, '200': 0.85, '300': 0.75, '400': 0.65,
  '500': 0.55, '600': 0.48, '700': 0.40, '800': 0.32, '900': 0.22,
};

export function scaleFromOklch(base: Oklch): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [step, l] of Object.entries(SCALE_LIGHTNESS)) {
    out[step] = oklchToHex({ l, c: base.c, h: base.h });
  }
  return out;
}

export function rotateHue(base: Oklch, deg: number): Oklch {
  return { l: base.l, c: base.c, h: (base.h + deg) % 360 };
}
