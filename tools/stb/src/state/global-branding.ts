import { signal } from '@preact/signals-core';
import type { BrandingModel } from '@/metadata/types';
import type { NavNode } from '@/navigator/column-model';

export interface GlobalModel {
  nodes: NavNode[];
  sceneNames: Record<string, string>; // scene id → friendly name (the area label)
}

// The whole-UI aggregate: every scene's branding-model merged into one set, so
// the Miller-column navigator drills across all scenes (per the §0 "one tool
// over the whole UI" intent), not just the active scene. Scenes with no
// branding-model.json yet simply contribute nothing.
export const globalModel = signal<GlobalModel | null>(null);

// Pure helper — flatten an array of per-scene models into scene-tagged NavNodes.
// Extracted for testability; loadGlobalModel delegates its merge to this.
export function mergeScenes(perScene: { scene: string; model: BrandingModel }[]): NavNode[] {
  const nodes: NavNode[] = [];
  for (const { scene, model } of perScene) {
    for (const n of model.nodes) {
      nodes.push({ snapshotId: n.snapshotId, scene, name: n.name, description: n.description, value: n.value, ...(n.containerKind ? { containerKind: n.containerKind } : {}) });
    }
  }
  return nodes;
}

interface Manifest { scenes: { id: string; name: string }[] }

export async function loadGlobalModel(): Promise<void> {
  try {
    const manRes = await fetch('/snapshots/v1/manifest.json');
    if (!manRes.ok) { globalModel.value = null; return; }
    const manifest = (await manRes.json()) as Manifest;
    const sceneNames: Record<string, string> = {};
    const perScene: { scene: string; model: BrandingModel }[] = [];
    for (const s of manifest.scenes) {
      sceneNames[s.id] = s.name;
      try {
        const res = await fetch(`/snapshots/v1/${s.id}/branding-model.json`);
        const ct = res.headers.get('content-type') ?? '';
        if (!res.ok || !ct.includes('json')) continue; // scene not modelled yet
        const m = (await res.json()) as BrandingModel;
        perScene.push({ scene: s.id, model: m });
      } catch { /* skip a scene whose model fails to load */ }
    }
    globalModel.value = { nodes: mergeScenes(perScene), sceneNames };
  } catch {
    globalModel.value = null;
  }
}
