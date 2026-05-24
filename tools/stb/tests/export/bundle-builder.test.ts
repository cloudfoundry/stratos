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
});
