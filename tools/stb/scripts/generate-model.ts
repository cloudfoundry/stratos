import { readFileSync, writeFileSync } from 'node:fs';
import { harvestElements } from './harvest-login';
import type { BrandingModel, ElementNode, ScopedBlock, Facets } from '../src/metadata/types';
import { primaryValue } from '../src/metadata/facets';

// The branding model is GENERATED from the snapshot DOM: identity, role,
// roledescription (the "kind") and description are harvested off the stba-*
// attributes; the only still-authored bits — the editable value, friendly name,
// and default visibility — come from a values.json sidecar keyed by snapshotId.
// (Next steps move name onto the DOM via aria-label and value via capture.)
export interface ValueEntry { name: string | null; facets: Facets; visibility?: boolean; scopedBlock?: ScopedBlock }
export type ValuesSidecar = Record<string, ValueEntry>;

export { primaryValue } from '../src/metadata/facets';

export function buildModel(scene: string, html: string, values: ValuesSidecar): BrandingModel {
  const nodes: ElementNode[] = [];
  for (const el of harvestElements(html)) {
    const v = values[el.snapshotId];
    if (!v) continue; // an instrumented element with no value isn't a lever (e.g. a label)
    const node: ElementNode = {
      snapshotId: el.snapshotId,
      role: el.role ?? '',
      name: v.name,
      description: el.description ?? '',
      facets: v.facets,
      value: primaryValue(v.facets),
    };
    if (el.roledescription) node.roledescription = el.roledescription;
    if (v.visibility !== undefined) node.visibility = v.visibility;
    if (v.scopedBlock) node.scopedBlock = v.scopedBlock;
    nodes.push(node);
  }
  return { scene, nodes };
}

// CLI: regenerate one scene's branding-model.json from its index.html + values.json
if (import.meta.url === `file://${process.argv[1]}`) {
  const scene = process.argv[2];
  if (!scene) { console.error('usage: generate-model <scene>'); process.exit(2); }
  const dir = `public/snapshots/v1/${scene}`;
  const html = readFileSync(`${dir}/index.html`, 'utf8');
  const values = JSON.parse(readFileSync(`${dir}/values.json`, 'utf8')) as ValuesSidecar;
  const model = buildModel(scene, html, values);
  writeFileSync(`${dir}/branding-model.json`, JSON.stringify(model, null, 2) + '\n');
  console.log(`${scene}: ${model.nodes.length} nodes → branding-model.json`);
}
