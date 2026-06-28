import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveDescription } from '@/metadata/resolve';
import type { SceneMetadata, CuratedDescriptions } from '@/metadata/types';

const base = 'public/snapshots/v1';
const curated = JSON.parse(readFileSync(`${base}/curated-descriptions.json`, 'utf8')) as CuratedDescriptions;
const scenes = ['login', 'app-list'].map(
  (id) => JSON.parse(readFileSync(`${base}/${id}/metadata.json`, 'utf8')) as SceneMetadata,
);

describe('real scene metadata', () => {
  it('every mapping resolves to a non-empty description', () => {
    for (const scene of scenes) {
      expect(scene.version).toBe(2);
      for (const mapping of scene.mappings) {
        const desc = resolveDescription(mapping, curated);
        expect(desc, `${scene.id}/${mapping.snapshotId}`).toBeTruthy();
      }
    }
  });

  it('snapshotIds are unique within each scene', () => {
    for (const scene of scenes) {
      const ids = scene.mappings.map((m) => m.snapshotId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('login scene html carries a snapshot-id for every branding-model node', () => {
    const html = readFileSync(`${base}/login/index.html`, 'utf8');
    const model = JSON.parse(readFileSync(`${base}/login/branding-model.json`, 'utf8'));
    for (const node of model.nodes) {
      expect(html, `missing snapshot-id for ${node.snapshotId}`).toContain(`data-stratos-snapshot-id="${node.snapshotId}"`);
    }
  });
});
