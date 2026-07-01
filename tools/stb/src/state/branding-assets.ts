import { signal } from '@preact/signals-core';
import type { AssetInput } from '@/export/bundle-builder';
import type { LeverPatch } from '@/iframe-bridge/apply-levers';

export interface BrandingAsset { blob: Blob; filename: string; }

// keyed by asset ref (e.g. `assets/<filename>`) — a single node can carry multiple
// image blobs (background layers), so snapshotId is no longer a unique enough key.
export const brandingAssets = signal<Map<string, BrandingAsset>>(new Map());

export function setBrandingAsset(ref: string, blob: Blob, filename: string): void {
  const next = new Map(brandingAssets.value);
  next.set(ref, { blob, filename });
  brandingAssets.value = next;
}

export function assetRefFor(filename: string): string {
  return `assets/${filename}`;
}

export function brandingAssetInputs(store: Map<string, BrandingAsset>): AssetInput[] {
  // Store keys are already full refs — do not re-wrap with assetRefFor (would double-prefix).
  return [...store.entries()].map(([ref, a]) => ({ path: ref, blob: a.blob }));
}

export function attachAssetBlobs(patches: LeverPatch[], store: Map<string, BrandingAsset>): LeverPatch[] {
  return patches.map((p) => {
    if (p.kind === 'asset') {
      if (!p.ref) return p;
      const a = store.get(p.ref);
      return a ? { ...p, blob: a.blob } : p;
    }
    if (p.kind === 'background') {
      if (!p.backgroundImage) return p;
      // Substitute url(<ref>) -> url(<objectURL>) for any layer ref with an uploaded blob;
      // leverPatchesFor stays pure (no store access), so the swap happens here instead.
      const swapped = p.backgroundImage.replace(/url\(([^)]+)\)/g, (whole, ref: string) => {
        const a = store.get(ref);
        return a ? `url(${URL.createObjectURL(a.blob)})` : whole;
      });
      return { ...p, backgroundImage: swapped };
    }
    return p;
  });
}
