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

// Object URLs minted by rewriteAssetUrls, keyed per caller (e.g. one key per preview
// pane) so revoking one pane's stale URLs never touches another pane's still-displayed
// blob: URLs. Double-buffered per key: `current` is this call's mint, `previous` is the
// batch before it — see the revoke comment in rewriteAssetUrls for why both stay alive.
const mintedByCallsite = new Map<string, { current: string[]; previous: string[] }>();

/** Strip surrounding whitespace and (at most) one matching pair of quotes from a raw
 *  `url(...)` capture. Machine-generated CSS emits unquoted refs; user-authored
 *  scopedBlock CSS (the R1 escape hatch) conventionally quotes them — store keys are
 *  always unquoted, so an unstripped quoted ref would miss the lookup. */
function stripUrlRef(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

/** Substitute url(<ref>) -> url(<objectURL>) for any asset ref in `css` with a stored blob;
 *  unknown refs (snapshot-bundled files, not user uploads) pass through completely
 *  untouched — original text, quotes and whitespace intact. Scoped-block CSS is the only
 *  preview-facing consumer — the export path keeps raw refs on purpose, since the exported
 *  bundle ships real files at those paths and a blob: URL would be invalid there.
 *
 *  Mints one object URL per distinct ref per call (a ref repeated N times in the CSS
 *  shares one mint) and double-buffers revocation per `callsiteKey`: on call N, the
 *  batch from call N-1 is what the iframe's CURRENT stylesheet is still painting (the
 *  STB_APPLY_BLOCKS message hasn't necessarily been applied yet), so revoking it
 *  immediately can blank the painted background. Only the batch from N-2 — already
 *  superseded twice over — is revoked. This is deterministic (no setTimeout guess at
 *  when the iframe has applied the message) at the cost of one extra batch's worth of
 *  blob memory alive at a time, which is bounded and freed on the next call. */
export function rewriteAssetUrls(css: string, store: Map<string, BrandingAsset>, callsiteKey: string): string {
  const mintedForRef = new Map<string, string>();
  const minted: string[] = [];
  const out = css.replace(/url\(([^)]+)\)/g, (whole, rawRef: string) => {
    const ref = stripUrlRef(rawRef);
    const cached = mintedForRef.get(ref);
    if (cached) return `url(${cached})`;
    const a = store.get(ref);
    if (!a) return whole;
    const url = URL.createObjectURL(a.blob);
    mintedForRef.set(ref, url);
    minted.push(url);
    return `url(${url})`;
  });

  const batches = mintedByCallsite.get(callsiteKey);
  if (batches) for (const url of batches.previous) URL.revokeObjectURL(url);
  mintedByCallsite.set(callsiteKey, { current: minted, previous: batches?.current ?? [] });
  return out;
}
