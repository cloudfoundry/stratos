import { describe, it, expect } from 'vitest';
import { defaultTheme } from '@stratosui/theme';
import { luminance } from '../../../../theme/derive-dark';
import companyConfig from '../../../../theme/company-config.json';

// The default light colors reach 7:1, the WCAG 1.4.6 (AAA) level for
// text: muted text on the light backgrounds, link and button blue on white,
// and white on the blue of a primary button.
const ratio = (a: string | undefined, b: string | undefined) => {
  const [hi, lo] = [luminance(a ?? '')!, luminance(b ?? '')!].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('default light theme contrast', () => {
  it('muted text reaches 7:1 on white and on the secondary background', () => {
    expect(ratio(defaultTheme.layout.textMuted, '#ffffff')).toBeGreaterThanOrEqual(7);
    expect(ratio(defaultTheme.layout.textMuted, defaultTheme.layout.contentSecondary)).toBeGreaterThanOrEqual(7);
  });

  it('the blue of links and buttons reaches 7:1 with white', () => {
    for (const key of ['primary', 'secondary', 'accent', 'info'] as const) {
      expect(ratio(defaultTheme.colors[key], '#ffffff'), key).toBeGreaterThanOrEqual(7);
    }
  });

  // A color in company-config.json that differs from the default is taken as
  // an operator's brand color, and dark mode derives its own value from it.
  it('ships company-config.json with the default theme colors', () => {
    for (const [key, value] of Object.entries(companyConfig.theme)) {
      expect(value, key).toBe(defaultTheme.colors[key as keyof typeof defaultTheme.colors]);
    }
  });
});
