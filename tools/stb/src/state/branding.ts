import { signal } from '@preact/signals-core';
import type { BrandingModel, ElementNode, LeverValue } from '@/metadata/types';

export const brandingModel = signal<BrandingModel | null>(null);

export async function loadBrandingModel(scene: string): Promise<void> {
  // A scene may ship no branding-model.json; the dev server then answers with a
  // 404 page or the SPA HTML fallback. Guard so a missing/non-JSON model clears
  // the signal instead of throwing and leaving the previous scene's model loaded.
  try {
    const res = await fetch(`/snapshots/v1/${scene}/branding-model.json`);
    const contentType = res.headers.get('content-type') ?? '';
    if (!res.ok || !contentType.includes('json')) {
      brandingModel.value = null;
      return;
    }
    brandingModel.value = (await res.json()) as BrandingModel;
  } catch {
    brandingModel.value = null;
  }
}

export function nodeFor(snapshotId: string): ElementNode | undefined {
  return brandingModel.value?.nodes.find((n) => n.snapshotId === snapshotId);
}

export function setNodeValue(snapshotId: string, value: LeverValue): void {
  const m = brandingModel.value;
  if (!m) return;
  brandingModel.value = {
    ...m,
    nodes: m.nodes.map((n) => (n.snapshotId === snapshotId ? { ...n, value } : n)),
  };
}
