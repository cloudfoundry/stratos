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
    return p;
  });
}

// Object URLs minted by the most recent rewriteAssetUrls call, keyed per caller (e.g. one
// key per preview pane) so revoking one pane's stale URLs never touches another pane's
// still-displayed blob: URLs.
const mintedByCallsite = new Map<string, string[]>();

/** Substitute url(<ref>) -> url(<objectURL>) for any asset ref in `css` with a stored blob;
 *  unknown refs (snapshot-bundled files, not user uploads) pass through untouched. Scoped-block
 *  CSS is the only preview-facing consumer — the export path keeps raw refs on purpose, since
 *  the exported bundle ships real files at those paths and a blob: URL would be invalid there.
 *
 *  Mints a fresh object URL per call and revokes the previous call's URLs for the same
 *  `callsiteKey`, so repeated re-renders (token/model changes) don't leak blob URLs. */
export function rewriteAssetUrls(css: string, store: Map<string, BrandingAsset>, callsiteKey: string): string {
  const prev = mintedByCallsite.get(callsiteKey);
  if (prev) for (const url of prev) URL.revokeObjectURL(url);
  const minted: string[] = [];
  const out = css.replace(/url\(([^)]+)\)/g, (whole, ref: string) => {
    const a = store.get(ref);
    if (!a) return whole;
    const url = URL.createObjectURL(a.blob);
    minted.push(url);
    return `url(${url})`;
  });
  mintedByCallsite.set(callsiteKey, minted);
  return out;
}
