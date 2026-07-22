import { describe, it, expect, beforeEach } from 'vitest';
import {
  brandingAssets, setBrandingAsset, assetRefFor, brandingAssetInputs, attachAssetBlobs, rewriteAssetUrls,
  type BrandingAsset,
} from '@/state/branding-assets';
import type { LeverPatch } from '@/iframe-bridge/apply-levers';
import { emitScopedBlocks } from '@/parse/css-emitter';
import type { ElementNode } from '@/metadata/types';

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

  it('double-buffers: keeps the last TWO batches alive, revokes only the batch two calls back', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    const restore = stubCreateObjectURL({ a: 'blob:mock/1', b: 'blob:mock/2', c: 'blob:mock/3' });
    const revoked: string[] = [];
    const origRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = ((u: string) => revoked.push(u)) as typeof URL.revokeObjectURL;
    try {
      rewriteAssetUrls('url(assets/hero.jpg)', store, 'test-2'); // mints blob:mock/1
      expect(revoked).toEqual([]); // nothing to revoke on first call
      rewriteAssetUrls('url(assets/hero.jpg)', store, 'test-2'); // mints blob:mock/2
      expect(revoked).toEqual([]); // still nothing — call 1's URL is what the iframe is currently painting
      rewriteAssetUrls('url(assets/hero.jpg)', store, 'test-2'); // mints blob:mock/3
      expect(revoked).toEqual(['blob:mock/1']); // only the batch from TWO calls back is revoked
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

  it('rewrites a single-quoted url() ref (user-authored scopedBlock CSS convention)', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    const restore = stubCreateObjectURL({ hero: 'blob:mock/hero' });
    try {
      const out = rewriteAssetUrls("background-image: url('assets/hero.jpg');", store, 'test-quote-1');
      expect(out).toBe('background-image: url(blob:mock/hero);');
    } finally { restore(); }
  });

  it('rewrites a double-quoted url() ref', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    const restore = stubCreateObjectURL({ hero: 'blob:mock/hero' });
    try {
      const out = rewriteAssetUrls('background-image: url("assets/hero.jpg");', store, 'test-quote-2');
      expect(out).toBe('background-image: url(blob:mock/hero);');
    } finally { restore(); }
  });

  it('rewrites a whitespace-padded url() ref', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    const restore = stubCreateObjectURL({ hero: 'blob:mock/hero' });
    try {
      const out = rewriteAssetUrls('background-image: url(  assets/hero.jpg  );', store, 'test-quote-3');
      expect(out).toBe('background-image: url(blob:mock/hero);');
    } finally { restore(); }
  });

  it('leaves an unknown quoted ref completely untouched (original text, quotes and all)', () => {
    const store = new Map<string, BrandingAsset>();
    const css = "background-image: url('assets/unknown.jpg');";
    const out = rewriteAssetUrls(css, store, 'test-quote-4');
    expect(out).toBe(css);
  });

  it('mints one object URL per distinct ref within a single call, even if it appears N times', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    let calls = 0;
    const orig = URL.createObjectURL;
    URL.createObjectURL = (() => { calls++; return `blob:mock/${calls}`; }) as typeof URL.createObjectURL;
    try {
      const css = 'a { background-image: url(assets/hero.jpg); } b { background-image: url(assets/hero.jpg); }';
      const out = rewriteAssetUrls(css, store, 'test-dedupe');
      expect(calls).toBe(1); // one mint for two occurrences of the same ref
      expect(out).toBe('a { background-image: url(blob:mock/1); } b { background-image: url(blob:mock/1); }');
    } finally { URL.createObjectURL = orig; }
  });

  it('end-to-end: a quoted asset ref inside a scopedBlock (the R1 escape hatch) resolves through emitScopedBlocks + rewriteAssetUrls, matching applyScopedBlocksToPreview\'s path', () => {
    const store = new Map<string, BrandingAsset>([['assets/hero.jpg', { blob, filename: 'hero.jpg' }]]);
    const restore = stubCreateObjectURL({ hero: 'blob:mock/hero' });
    try {
      const nodes: ElementNode[] = [{
        snapshotId: 'auth.login.card',
        role: '',
        name: null,
        description: '',
        facets: {},
        scopedBlock: "background-image: url('assets/hero.jpg')",
      }];
      const css = emitScopedBlocks(nodes);
      const out = rewriteAssetUrls(css, store, 'test-e2e');
      expect(out).toContain('background-image: url(blob:mock/hero);');
      expect(out).not.toContain("assets/hero.jpg");
    } finally { restore(); }
  });
});
