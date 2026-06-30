import { describe, it, expect } from 'vitest';
import { deriveDarkOklch } from '@/color/derive-dark';

describe('deriveDarkOklch', () => {
  it('inverts lightness, halves chroma, shifts hue by 15deg', () => {
    const dark = deriveDarkOklch({ l: 0.9, c: 0.2, h: 250 });
    expect(dark.l).toBeCloseTo(0.1, 10);
    expect(dark.c).toBeCloseTo(0.1, 10);
    expect(dark.h).toBeCloseTo(265, 10);
  });

  it('double-application returns lightness to ~original (self-inverting axis)', () => {
    const original = { l: 0.3, c: 0.15, h: 100 };
    const roundTrip = deriveDarkOklch(deriveDarkOklch(original));
    expect(roundTrip.l).toBeCloseTo(original.l, 10);
  });

  it('wraps hue past 360', () => {
    const dark = deriveDarkOklch({ l: 0.5, c: 0.1, h: 350 });
    expect(dark.h).toBeCloseTo(5, 10);
  });
});
