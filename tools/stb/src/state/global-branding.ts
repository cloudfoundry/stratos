import { signal } from '@preact/signals-core';
import type { BrandingModel, ElementNode } from '@/metadata/types';

// A node tagged with the scene it came from, so the global navigator can route
// a selection back to the right preview scene.
export interface GlobalNode extends ElementNode {
  scene: string;
}

export interface GlobalModel {
  nodes: GlobalNode[];
}

// The whole-UI aggregate: every scene's branding-model merged into one set, so
// the Miller-column navigator drills across all scenes (per the §0 "one tool
// over the whole UI" intent), not just the active scene. Scenes with no
// branding-model.json yet simply contribute nothing.
export const globalModel = signal<GlobalModel | null>(null);

interface Manifest { scenes: { id: string }[] }

export async function loadGlobalModel(): Promise<void> {
  try {
    const manRes = await fetch('/snapshots/v1/manifest.json');
    if (!manRes.ok) { globalModel.value = null; return; }
    const manifest = (await manRes.json()) as Manifest;
    const nodes: GlobalNode[] = [];
    for (const s of manifest.scenes) {
      try {
        const res = await fetch(`/snapshots/v1/${s.id}/branding-model.json`);
        const ct = res.headers.get('content-type') ?? '';
        if (!res.ok || !ct.includes('json')) continue; // scene not modelled yet
        const m = (await res.json()) as BrandingModel;
        for (const n of m.nodes) nodes.push({ ...n, scene: s.id });
      } catch { /* skip a scene whose model fails to load */ }
    }
    globalModel.value = { nodes };
  } catch {
    globalModel.value = null;
  }
}
