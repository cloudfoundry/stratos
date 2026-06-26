import { describe, it, expect } from 'vitest';
import { toOklch, scaleFromOklch, rotateHue } from '@/color/oklch';

describe('oklch derivation', () => {
  it('builds a 50..900 scale with decreasing lightness', () => {
    const scale = scaleFromOklch(toOklch('#2196f3'));
    expect(Object.keys(scale)).toEqual(['50','100','200','300','400','500','600','700','800','900']);
    expect(toOklch(scale['50']!).l).toBeGreaterThan(toOklch(scale['900']!).l);
  });

  it('rotateHue changes hue but not lightness/chroma', () => {
    const base = toOklch('#2196f3');
    const rot = rotateHue(base, 180);
    expect(rot.l).toBeCloseTo(base.l, 5);
    expect(rot.c).toBeCloseTo(base.c, 5);
    expect(Math.abs(rot.h - base.h)).toBeCloseTo(180, 1);
  });
});
