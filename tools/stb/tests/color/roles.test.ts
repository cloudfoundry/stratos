import { describe, it, expect } from 'vitest';
import { deriveAlertRoles } from '@/color/roles';
import { contrastRatio, relativeLuminance } from '@/color/contrast';
import { toOklch } from '@/color/oklch';

describe('deriveAlertRoles', () => {
  const danger = '#c0392b';

  it('text meets the target contrast against the derived background (light)', () => {
    const r = deriveAlertRoles(danger, { targetRatio: 4.5 });
    expect(contrastRatio(r.text, r.background)).toBeGreaterThanOrEqual(4.5);
    expect(r.meetsAA).toBe(true);
    expect(r.contrast).toBeCloseTo(contrastRatio(r.text, r.background), 5);
  });

  it('light mode: light background, dark text (divergent lightness, not chance)', () => {
    const r = deriveAlertRoles(danger, {});
    expect(relativeLuminance(r.background)).toBeGreaterThan(relativeLuminance(r.text));
  });

  it('dark mode inverts: dark background, light text, still meets contrast', () => {
    const r = deriveAlertRoles(danger, { dark: true });
    expect(relativeLuminance(r.background)).toBeLessThan(relativeLuminance(r.text));
    expect(contrastRatio(r.text, r.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the alert on the seed hue (text stays branded)', () => {
    const seedHue = toOklch(danger).h;
    const r = deriveAlertRoles(danger, {});
    expect(Math.abs(toOklch(r.text).h - seedHue)).toBeLessThan(5);
  });
});
