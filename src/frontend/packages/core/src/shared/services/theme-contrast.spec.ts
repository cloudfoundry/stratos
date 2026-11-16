import { describe, it, expect } from 'vitest';
import { defaultTheme } from '@stratosui/theme';
import { luminance } from '../../../../theme/derive-dark';

// The default light colors reach 7:1, the WCAG 1.4.6 (AAA) level for
// text.
const ratio = (a: string | undefined, b: string | undefined) => {
  const [hi, lo] = [luminance(a ?? '')!, luminance(b ?? '')!].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('default light theme contrast', () => {
  it('muted text reaches 7:1 on white and on the secondary background', () => {
    expect(ratio(defaultTheme.layout.textMuted, '#ffffff')).toBeGreaterThanOrEqual(7);
    expect(ratio(defaultTheme.layout.textMuted, defaultTheme.layout.contentSecondary)).toBeGreaterThanOrEqual(7);
  });

});
