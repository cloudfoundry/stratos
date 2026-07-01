import { describe, it, expect, beforeEach } from 'vitest';
import {
  brandingAssets, setBrandingAsset, assetRefFor, brandingAssetInputs, attachAssetBlobs, type BrandingAsset,
} from '@/state/branding-assets';
import type { LeverPatch } from '@/iframe-bridge/apply-levers';

const blobA = new Blob(['a'], { type: 'image/png' });
const blobB = new Blob(['b'], { type: 'image/jpeg' });

describe('branding-assets', () => {
  beforeEach(() => { brandingAssets.value = new Map(); });

  it('assetRefFor prefixes the bundle assets path', () => {
    expect(assetRefFor('logo.png')).toBe('assets/logo.png');
  });

  it('setBrandingAsset stores per ref immutably and keeps multiple blobs', () => {
    const before = brandingAssets.value;
    setBrandingAsset('assets/logo.png', blobA, 'logo.png');
    setBrandingAsset('assets/bg.jpg', blobB, 'bg.jpg');
    expect(brandingAssets.value).not.toBe(before);            // new ref → reactivity
    expect(brandingAssets.value.get('assets/logo.png')?.filename).toBe('logo.png');
    expect(brandingAssets.value.get('assets/bg.jpg')?.filename).toBe('bg.jpg'); // no overwrite
  });

  it('brandingAssetInputs maps the store to bundle asset inputs by ref key (no double-prefixing)', () => {
    const store = new Map<string, BrandingAsset>([
      ['assets/logo.png', { blob: blobA, filename: 'logo.png' }],
      ['assets/bg.jpg', { blob: blobB, filename: 'bg.jpg' }],
    ]);
    expect(brandingAssetInputs(store)).toEqual([
      { path: 'assets/logo.png', blob: blobA },
      { path: 'assets/bg.jpg', blob: blobB },
    ]);
  });

  it('stores multiple blobs keyed by ref', () => {
    const store = new Map();
    const a = new Blob(['a']); const b = new Blob(['b']);
    store.set('assets/one.png', { blob: a, filename: 'one.png' });
    store.set('assets/two.png', { blob: b, filename: 'two.png' });
    const inputs = brandingAssetInputs(store);
    expect(inputs.map((i) => i.path).sort()).toEqual(['assets/one.png', 'assets/two.png']);
  });

  it('attachAssetBlobs attaches a stored blob to matching asset patches, leaves others untouched', () => {
    const store = new Map<string, BrandingAsset>([['assets/logo.png', { blob: blobA, filename: 'logo.png' }]]);
    const patches: LeverPatch[] = [
      { snapshotId: 'auth.login.logo', kind: 'asset', ref: 'assets/logo.png' },
      { snapshotId: 'auth.login.title', kind: 'content', text: 'Hi' },
      { snapshotId: 'auth.login.background', kind: 'asset', ref: 'assets/none.jpg' }, // no stored blob
    ];
    const out = attachAssetBlobs(patches, store);
    expect(out[0]).toEqual({ snapshotId: 'auth.login.logo', kind: 'asset', ref: 'assets/logo.png', blob: blobA });
    expect(out[1]).toEqual(patches[1]);                       // content untouched
    expect(out[2]).toEqual(patches[2]);                       // asset w/o stored blob untouched (no blob key)
  });

  it('attachAssetBlobs swaps url(<ref>) with an object URL for background patches with a stored blob', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob: blobA, filename: 'hero.jpg' }]]);
    const patches: LeverPatch[] = [
      {
        snapshotId: 'a.card', kind: 'background', backgroundColor: '#0b3d91',
        backgroundImage: 'linear-gradient(rgba(0,0,0,.6), transparent), url(assets/hero.jpg), url(assets/none.jpg)',
      },
    ];
    // jsdom doesn't implement URL.createObjectURL — stub it locally for this assertion only.
    const orig = URL.createObjectURL;
    URL.createObjectURL = ((b: Blob) => (b === blobA ? 'blob:mock/hero' : 'blob:mock/other')) as typeof URL.createObjectURL;
    try {
      const out = attachAssetBlobs(patches, store);
      const img = (out[0] as LeverPatch).backgroundImage!;
      expect(img).toContain('url(blob:mock/hero)');
      expect(img).toContain('url(assets/none.jpg)'); // untouched ref with no stored blob
    } finally {
      URL.createObjectURL = orig;
    }
  });
});
