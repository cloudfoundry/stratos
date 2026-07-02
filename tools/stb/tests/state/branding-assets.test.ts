import { describe, it, expect, beforeEach } from 'vitest';
import {
  brandingAssets, setBrandingAsset, assetRefFor, brandingAssetInputs, attachAssetBlobs, rewriteAssetUrls,
  type BrandingAsset,
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

});

describe('rewriteAssetUrls', () => {
  const blob = new Blob(['a'], { type: 'image/jpeg' });

  function stubCreateObjectURL(map: Record<string, string>): () => void {
    const orig = URL.createObjectURL;
    let n = 0;
    const urls = Object.values(map);
    URL.createObjectURL = (() => urls[n++] ?? `blob:mock/${n}`) as typeof URL.createObjectURL;
    return () => { URL.createObjectURL = orig; };
  }

  it('rewrites url(<ref>) to url(<objectURL>) for a stored asset, leaves unknown refs untouched', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    const restore = stubCreateObjectURL({ hero: 'blob:mock/hero' });
    try {
      const css = 'html .a { background-image: linear-gradient(red, blue), url(assets/hero.jpg), url(assets/none.jpg); }';
      const out = rewriteAssetUrls(css, store, 'test-1');
      expect(out).toContain('url(blob:mock/hero)');
      expect(out).toContain('url(assets/none.jpg)'); // no stored blob → passed through
    } finally { restore(); }
  });

  it('revokes the previous call\'s object URLs for the same callsite key when minting new ones', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    const restore = stubCreateObjectURL({ a: 'blob:mock/1', b: 'blob:mock/2' });
    const revoked: string[] = [];
    const origRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = ((u: string) => revoked.push(u)) as typeof URL.revokeObjectURL;
    try {
      rewriteAssetUrls('url(assets/hero.jpg)', store, 'test-2');
      expect(revoked).toEqual([]); // nothing to revoke on first call
      rewriteAssetUrls('url(assets/hero.jpg)', store, 'test-2');
      expect(revoked).toEqual(['blob:mock/1']); // first call's URL revoked on replace
    } finally { restore(); URL.revokeObjectURL = origRevoke; }
  });

  it('does not revoke a different callsite key\'s URLs', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    const restore = stubCreateObjectURL({ a: 'blob:mock/1', b: 'blob:mock/2' });
    const revoked: string[] = [];
    const origRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = ((u: string) => revoked.push(u)) as typeof URL.revokeObjectURL;
    try {
      rewriteAssetUrls('url(assets/hero.jpg)', store, 'pane-light');
      rewriteAssetUrls('url(assets/hero.jpg)', store, 'pane-dark');
      expect(revoked).toEqual([]); // distinct keys, nothing revoked
    } finally { restore(); URL.revokeObjectURL = origRevoke; }
  });
});
