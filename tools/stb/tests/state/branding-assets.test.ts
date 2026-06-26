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

  it('setBrandingAsset stores per snapshotId immutably and keeps both logo and background', () => {
    const before = brandingAssets.value;
    setBrandingAsset('auth.login.logo', blobA, 'logo.png');
    setBrandingAsset('auth.login.background', blobB, 'bg.jpg');
    expect(brandingAssets.value).not.toBe(before);            // new ref → reactivity
    expect(brandingAssets.value.get('auth.login.logo')?.filename).toBe('logo.png');
    expect(brandingAssets.value.get('auth.login.background')?.filename).toBe('bg.jpg'); // no overwrite
  });

  it('brandingAssetInputs maps the store to bundle asset inputs', () => {
    const store = new Map<string, BrandingAsset>([
      ['auth.login.logo', { blob: blobA, filename: 'logo.png' }],
      ['auth.login.background', { blob: blobB, filename: 'bg.jpg' }],
    ]);
    expect(brandingAssetInputs(store)).toEqual([
      { path: 'assets/logo.png', blob: blobA },
      { path: 'assets/bg.jpg', blob: blobB },
    ]);
  });

  it('attachAssetBlobs attaches a stored blob to matching asset patches, leaves others untouched', () => {
    const store = new Map<string, BrandingAsset>([['auth.login.logo', { blob: blobA, filename: 'logo.png' }]]);
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
