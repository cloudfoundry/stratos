import { describe, it, expect } from 'vitest';
import { deriveDarkOklch } from '@/color/derive-dark';
import { oklchToHex } from '@/color/oklch';
import { contrastRatio } from '@/color/contrast';

// The assumed dark surface a foreground color is derived against when no
// explicit background is supplied (mirrors the value in derive-dark.ts).
const ASSUMED_DARK = { l: 0.2, c: 0, h: 0 };

describe('deriveDarkOklch — foreground (default)', () => {
  it('preserves hue and chroma (no muddy chroma-halving)', () => {
    const light = { l: 0.62, c: 0.22, h: 27 };
    const dark = deriveDarkOklch(light);
    expect(dark.h).toBeCloseTo(27, 5);
    expect(dark.c).toBeCloseTo(0.22, 5);
  });

  it('lifts lightness so the color stays legible on a dark surface', () => {
    const light = { l: 0.62, c: 0.22, h: 27 }; // a mid red — old recipe made a muddy dark brown
    const dark = deriveDarkOklch(light);
    expect(dark.l).toBeGreaterThan(light.l);
    expect(contrastRatio(oklchToHex(dark), oklchToHex(ASSUMED_DARK))).toBeGreaterThanOrEqual(4.5);
  });

  it('contrasts against an explicitly supplied background', () => {
    const light = { l: 0.5, c: 0.15, h: 250 };
    const lightBg = { l: 0.95, c: 0.02, h: 250 };
    const dark = deriveDarkOklch(light, { background: lightBg });
    // a light background pushes the derived color darker to keep contrast
    expect(contrastRatio(oklchToHex(dark), oklchToHex(lightBg))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('deriveDarkOklch — background (surface)', () => {
  it('inverts lightness but keeps chroma and hue', () => {
    const dark = deriveDarkOklch({ l: 0.9, c: 0.1, h: 250 }, { role: 'background' });
    expect(dark.l).toBeCloseTo(0.1, 5);
    expect(dark.c).toBeCloseTo(0.1, 5); // NOT halved
    expect(dark.h).toBeCloseTo(250, 5);
  });

  it('turns a white surface dark', () => {
    const dark = deriveDarkOklch({ l: 1, c: 0, h: 0 }, { role: 'background' });
    expect(dark.l).toBeCloseTo(0, 5);
  });
});
