import { describe, it, expect } from 'vitest';
import { buildBundle } from '@/export/bundle-builder';

describe('buildBundle', () => {
  it('produces a bundle with theme.css and preset.json', async () => {
    const root = new Map([['--color-brand-500', '#aaa']]);
    const dark = new Map([['--color-brand-500', '#bbb']]);
    const bundle = buildBundle({
      name: 'My brand',
      id: 'my-brand',
      description: 'Test',
      root,
      dark,
      assets: [],
    });
    expect(bundle.files['preset.json']).toContain('"name": "My brand"');
    expect(bundle.files['theme.css']).toContain('--color-brand-500: #aaa;');
    expect(bundle.files['theme.css']).toContain('.dark-theme');
  });

  it('includes asset blobs', async () => {
    const blob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
    const bundle = buildBundle({
      name: 'My brand',
      id: 'my-brand',
      description: '',
      root: new Map(),
      dark: new Map(),
      assets: [{ path: 'assets/logo.svg', blob }],
    });
    expect(bundle.assetBlobs.get('assets/logo.svg')).toBe(blob);
  });

  it('emits company-config.json when companyConfig is provided', () => {
    const bundle = buildBundle({
      name: 'b', id: 'b', description: '',
      root: new Map(), dark: new Map(), assets: [],
      companyConfig: { login: { title: 'Sign in to Stratos' } },
    });
    expect(bundle.files['company-config.json']).toContain('"title": "Sign in to Stratos"');
  });

  it('omits company-config.json when companyConfig is absent', () => {
    const bundle = buildBundle({
      name: 'b', id: 'b', description: '', root: new Map(), dark: new Map(), assets: [],
    });
    expect(bundle.files['company-config.json']).toBeUndefined();
  });
});
