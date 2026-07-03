import { signal } from '@preact/signals-core';
import type { BrandingModel, ElementNode, Facets, ScopedBlock } from '@/metadata/types';

export const brandingModel = signal<BrandingModel | null>(null);

// Pristine copy of the loaded model — the "delete my edits" baseline. Close
// puts the editor away; resetNode restores THIS. Kept outside the signal so
// edits can never touch it.
let pristineModel: BrandingModel | null = null;

export async function loadBrandingModel(scene: string): Promise<void> {
  // A scene may ship no branding-model.json; the dev server then answers with a
  // 404 page or the SPA HTML fallback. Guard so a missing/non-JSON model clears
  // the signal instead of throwing and leaving the previous scene's model loaded.
  try {
    const res = await fetch(`/snapshots/v1/${scene}/branding-model.json`);
    const contentType = res.headers.get('content-type') ?? '';
    if (!res.ok || !contentType.includes('json')) {
      brandingModel.value = null;
      pristineModel = null;
      return;
    }
    const model = (await res.json()) as BrandingModel;
    pristineModel = structuredClone(model);
    brandingModel.value = model;
  } catch {
    brandingModel.value = null;
    pristineModel = null;
  }
}

/** Discard every edit on one element — facets, dark bundle, scoped block,
 *  visibility — restoring the node exactly as the generated model shipped it.
 *  Returns the restored node so callers can re-project its tokens. */
export function resetNode(snapshotId: string): ElementNode | undefined {
  const m = brandingModel.value;
  const p = pristineModel?.nodes.find((n) => n.snapshotId === snapshotId);
  if (!m || !p) return undefined;
  const restored = structuredClone(p);
  brandingModel.value = {
    ...m,
    nodes: m.nodes.map((n) => (n.snapshotId === snapshotId ? restored : n)),
  };
  return restored;
}

export function nodeFor(snapshotId: string): ElementNode | undefined {
  return brandingModel.value?.nodes.find((n) => n.snapshotId === snapshotId);
}

/** Update node.facets in a single signal write. */
export function setNodeFacets(snapshotId: string, facets: Facets): void {
  const m = brandingModel.value;
  if (!m) return;
  brandingModel.value = {
    ...m,
    nodes: m.nodes.map((n) => (n.snapshotId === snapshotId ? { ...n, facets } : n)),
  };
}

/** Update node.facetsDark (parallel dark bundle) in a single signal write. */
export function setNodeFacetsDark(snapshotId: string, facetsDark: Facets): void {
  const m = brandingModel.value;
  if (!m) return;
  brandingModel.value = {
    ...m,
    nodes: m.nodes.map((n) => (n.snapshotId === snapshotId ? { ...n, facetsDark } : n)),
  };
}

export function setNodeVisibility(snapshotId: string, shown: boolean): void {
  const m = brandingModel.value;
  if (!m) return;
  brandingModel.value = {
    ...m,
    nodes: m.nodes.map((n) => (n.snapshotId === snapshotId ? { ...n, visibility: shown } : n)),
  };
}

export function setNodeScopedBlock(snapshotId: string, scopedBlock: ScopedBlock): void {
  const m = brandingModel.value;
  if (!m) return;
  brandingModel.value = {
    ...m,
    nodes: m.nodes.map((n) => (n.snapshotId === snapshotId ? { ...n, scopedBlock } : n)),
  };
}
