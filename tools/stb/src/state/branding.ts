import { signal } from '@preact/signals-core';
import type { BrandingModel, ElementNode, LeverValue } from '@/metadata/types';

export const brandingModel = signal<BrandingModel | null>(null);

export async function loadBrandingModel(scene: string): Promise<void> {
  const res = await fetch(`/snapshots/v1/${scene}/branding-model.json`);
  brandingModel.value = (await res.json()) as BrandingModel;
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
