import { signal } from '@preact/signals-core';
import type { AssetInput } from '@/export/bundle-builder';
import type { LeverPatch } from '@/iframe-bridge/apply-levers';

export interface BrandingAsset { blob: Blob; filename: string; }

// keyed by snapshotId — parallel to the logo/favicon `assets` slots, untouched here
export const brandingAssets = signal<Map<string, BrandingAsset>>(new Map());

export function setBrandingAsset(snapshotId: string, blob: Blob, filename: string): void {
  const next = new Map(brandingAssets.value);
  next.set(snapshotId, { blob, filename });
  brandingAssets.value = next;
}

export function assetRefFor(filename: string): string {
  return `assets/${filename}`;
}

export function brandingAssetInputs(store: Map<string, BrandingAsset>): AssetInput[] {
  return [...store.values()].map((a) => ({ path: assetRefFor(a.filename), blob: a.blob }));
}

export function attachAssetBlobs(patches: LeverPatch[], store: Map<string, BrandingAsset>): LeverPatch[] {
  return patches.map((p) => {
    if (p.kind !== 'asset') return p;
    const a = store.get(p.snapshotId);
    return a ? { ...p, blob: a.blob } : p;
  });
}
