import { signal } from '@preact/signals-core';

export interface AssetSlot {
  name: 'logo' | 'favicon';
  blob: Blob | null;
  filename: string | null;
}

export const assets = signal<AssetSlot[]>([
  { name: 'logo', blob: null, filename: null },
  { name: 'favicon', blob: null, filename: null },
]);

export function setAsset(name: 'logo' | 'favicon', blob: Blob, filename: string): void {
  assets.value = assets.value.map((a) => (a.name === name ? { ...a, blob, filename } : a));
}

export function clearAsset(name: 'logo' | 'favicon'): void {
  assets.value = assets.value.map((a) => (a.name === name ? { ...a, blob: null, filename: null } : a));
}
