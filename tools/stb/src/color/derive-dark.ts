import type { Oklch } from '@/color/oklch';
import { oklchToHex } from '@/color/oklch';
import { contrastRatio } from '@/color/contrast';

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export interface DeriveDarkContext {
  /** The effective dark-mode surface behind this color. A foreground color is
   *  pushed to the lightness that contrasts with it. Omit to assume a dark surface. */
  background?: Oklch;
  /** 'background' (a surface fill) inverts lightness so a light surface becomes a
   *  dark one; 'foreground' (default: text, borders) keeps hue + chroma and moves
   *  lightness toward the end that stays legible against the background. */
  role?: 'foreground' | 'background';
}

// Assumed surface when the caller can't resolve the element's real dark
// background (the snapshot-id hierarchy doesn't always match DOM nesting).
// A dark surface is the right default in dark mode.
const ASSUMED_DARK: Oklch = { l: 0.2, c: 0, h: 0 };
const TARGET_RATIO = 4.5; // WCAG AA body text

// Derive a dark-mode value from a light one. The key fix over a naive
// lightness-inversion: keep the chroma (halving it is what turned a red into a
// muddy brown) and derive against the background so the result stays legible.
export function deriveDarkOklch(light: Oklch, ctx: DeriveDarkContext = {}): Oklch {
  if ((ctx.role ?? 'foreground') === 'background') {
    // A surface fill: flip lightness (light surface → dark surface), keep hue + chroma.
    return { l: clamp01(1 - light.l), c: light.c, h: light.h };
  }

  // Foreground: hold hue + chroma; search lightness toward the contrasting end
  // of the background until it meets the contrast target.
  const bg = ctx.background ?? ASSUMED_DARK;
  const bgHex = oklchToHex(bg);
  const goLighter = bg.l < 0.5;
  const step = goLighter ? 0.02 : -0.02;

  // Start past the midpoint on the contrasting side so a dark-mode foreground is a
  // visibly softer/lighter tint (the #ef4444 → #f87171 convention), not the same
  // colour it was in light mode; then keep stepping until the contrast target holds.
  let l = clamp01(goLighter ? Math.max(light.l, 0.7) : Math.min(light.l, 0.35));
  const at = (ll: number): Oklch => ({ l: ll, c: light.c, h: light.h });
  let ratio = contrastRatio(oklchToHex(at(l)), bgHex);
  for (let i = 0; i < 60 && ratio < TARGET_RATIO && l > 0 && l < 1; i++) {
    l = clamp01(l + step);
    ratio = contrastRatio(oklchToHex(at(l)), bgHex);
  }
  return at(l);
}
