import { describe, it, expect, beforeEach } from 'vitest';
import { brandingModel } from '@/state/branding';
import { rootValues, darkValues, effectiveValue } from '@/state/tokens';
import { reprojectNodeTokensDark } from '@/ui/element-edit';
import type { BrandingModel } from '@/metadata/types';

const routing = { containers: { 'auth.login': 'login' }, elements: {
  'auth.login.sign-in': { properties: { 'surface.background': { token: '--color-x' } } },
} };
const model: BrandingModel = { scene: 'login', nodes: [
  { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn',
    facets: { surface: { background: { literal: { l: 0.4, c: 0.1, h: 30 } } } } },
] };

describe('reprojectNodeTokensDark', () => {
  beforeEach(() => {
    brandingModel.value = JSON.parse(JSON.stringify(model));
    rootValues.value = new Map([['--color-x', '#112233']]);
    darkValues.value = new Map();
  });

  it('re-projects a dark facet color edit to the bound token via setDarkValue', () => {
    reprojectNodeTokensDark(
      'auth.login.sign-in',
      { surface: { background: { literal: { l: 0.6, c: 0.12, h: 200 } } } },
      routing,
    );
    expect(effectiveValue('--color-x', true)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('leaves the light value (rootValues) untouched', () => {
    reprojectNodeTokensDark(
      'auth.login.sign-in',
      { surface: { background: { literal: { l: 0.6, c: 0.12, h: 200 } } } },
      routing,
    );
    expect(effectiveValue('--color-x', false)).toBe('#112233');
    expect(rootValues.value.get('--color-x')).toBe('#112233');
  });
});
