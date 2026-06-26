import { describe, it, expect } from 'vitest';
import { toOklch, oklchToHex } from '@/color/oklch';

describe('oklch conversion', () => {
  it('white is near L=1, C=0', () => {
    const o = toOklch('#ffffff');
    expect(o.l).toBeCloseTo(1, 2);
    expect(o.c).toBeCloseTo(0, 2);
  });

  it('black is near L=0', () => {
    expect(toOklch('#000000').l).toBeCloseTo(0, 2);
  });

  it('round-trips a mid-tone within 1/255 per channel', () => {
    expect(oklchToHex(toOklch('#2196f3'))).toBe('#2196f3');
  });
});
