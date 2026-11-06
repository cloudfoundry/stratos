import { describe, it, expect } from 'vitest';
import { relativeLuminance, contrastRatio } from '@/color/contrast';

describe('relativeLuminance', () => {
  it('is 1 for white and 0 for black', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });
});

describe('contrastRatio (WCAG 2.x)', () => {
  it('is 21 for black on white (the maximum)', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });
  it('is symmetric (order does not matter)', () => {
    expect(contrastRatio('#2196f3', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#2196f3'), 10);
  });
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#2196f3', '#2196f3')).toBeCloseTo(1, 5);
  });
});
