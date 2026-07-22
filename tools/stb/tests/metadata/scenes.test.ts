import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildModel, type ValuesSidecar } from '../../scripts/generate-model';
import type { BrandingModel } from '@/metadata/types';

const base = 'public/snapshots/v1';
const scenes = ['login', 'app-list', 'shared'];

function load(scene: string) {
  return {
    html: readFileSync(`${base}/${scene}/index.html`, 'utf8'),
    values: JSON.parse(readFileSync(`${base}/${scene}/values.json`, 'utf8')) as ValuesSidecar,
    model: JSON.parse(readFileSync(`${base}/${scene}/branding-model.json`, 'utf8')) as BrandingModel,
  };
}

describe('branding model is generated from the DOM', () => {
  it('committed branding-model.json matches a fresh generate from index.html + values.json', () => {
    for (const scene of scenes) {
      const { html, values, model } = load(scene);
      expect(buildModel(scene, html, values), `${scene} is out of sync — re-run generate-model`).toEqual(model);
    }
  });

  it('every node carries an stba-description (harvested from the DOM)', () => {
    for (const scene of scenes) {
      const { model } = load(scene);
      for (const node of model.nodes) {
        expect(node.description, `${scene}/${node.snapshotId}`).toBeTruthy();
      }
    }
  });

  it('every model node has a snapshot-id in the scene html', () => {
    for (const scene of scenes) {
      const { html, model } = load(scene);
      for (const node of model.nodes) {
        expect(html, `missing snapshot-id for ${node.snapshotId}`).toContain(`stb-snapshot-id="${node.snapshotId}"`);
      }
    }
  });
});
