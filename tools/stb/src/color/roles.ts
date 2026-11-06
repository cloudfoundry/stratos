import { toOklch, oklchToHex } from '@/color/oklch';
import { contrastRatio } from '@/color/contrast';

// Principled version of the .alert-danger pattern: from one seed colour, derive
// a background / border / text trio that stays ON the seed hue but is pushed to
// DIVERGENT lightness so text-on-background meets a contrast target. (The token
// "overload" works by derivation to divergent lightness, not by chance.)

export interface AlertRoles {
  background: string;
  border: string;
  text: string;
  contrast: number;   // achieved text-on-background ratio
  meetsAA: boolean;   // contrast >= targetRatio
}

export interface DeriveAlertOptions {
  targetRatio?: number; // default 4.5 (WCAG AA body text)
  dark?: boolean;       // dark surface: invert (dark bg, light text)
}

export function deriveAlertRoles(seedHex: string, opts: DeriveAlertOptions = {}): AlertRoles {
  const target = opts.targetRatio ?? 4.5;
  const dark = opts.dark ?? false;
  const { h, c } = toOklch(seedHex);

  // Background reads as a tinted surface: anchored light (or dark), low chroma.
  const background = oklchToHex({ l: dark ? 0.25 : 0.95, c: Math.min(c, 0.04), h });
  const border = oklchToHex({ l: dark ? 0.4 : 0.8, c: Math.min(c, 0.1), h });

  // Text: keep the seed hue/chroma, search lightness toward the contrasting end
  // (darker on a light surface, lighter on a dark surface) until contrast holds.
  const textC = Math.min(c, 0.18);
  const step = dark ? 0.02 : -0.02;
  let l = dark ? 0.6 : 0.5;
  let text = oklchToHex({ l, c: textC, h });
  let ratio = contrastRatio(text, background);
  for (let i = 0; i < 50 && ratio < target && l > 0 && l < 1; i++) {
    l = Math.max(0, Math.min(1, l + step));
    text = oklchToHex({ l, c: textC, h });
    ratio = contrastRatio(text, background);
  }

  return { background, border, text, contrast: ratio, meetsAA: ratio >= target };
}
