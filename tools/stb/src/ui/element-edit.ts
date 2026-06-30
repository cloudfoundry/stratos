import type { Facets, FacetValue, LeverValue } from '@/metadata/types';
import type { RoutingMap } from '@/projection/projector';
import { project } from '@/projection/projector';
import { brandingModel, setNodeFacets, setNodeVisibility } from '@/state/branding';
import { setRootValue } from '@/state/tokens';

export function buildVisibilityCompanion(
  snapshotId: string,
  visibility: boolean | undefined,
): { visibilityCompanion?: { shown: boolean; onChange: (shown: boolean) => void } } {
  if (visibility === undefined) return {};
  return {
    visibilityCompanion: {
      shown: visibility,
      onChange: (shown: boolean) => setNodeVisibility(snapshotId, shown),
    },
  };
}

/** Map a LeverValue edit back into the Facets bundle it was sourced from. */
function leverValueToFacets(value: LeverValue, existing: Facets): Facets {
  if (value.kind === 'content') return { ...existing, content: { text: value.text } };
  if (value.kind === 'asset') return { ...existing, asset: { ref: value.ref } };
  // color: write into the same slot primaryValue read from (text.color > surface.background)
  const colorFacet: FacetValue = { literal: value.oklch };
  if (existing.text?.color !== undefined) {
    return { ...existing, text: { ...existing.text, color: colorFacet } };
  }
  return { ...existing, surface: { ...existing.surface, background: colorFacet } };
}

export function reprojectNodeTokens(snapshotId: string, facets: Facets, routing: RoutingMap): void {
  const m = brandingModel.value;
  if (!m) return;
  const node = m.nodes.find((n) => n.snapshotId === snapshotId);
  if (!node) return;
  const { tokens } = project({ scene: m.scene, nodes: [{ ...node, facets }] }, routing);
  for (const [k, v] of tokens) setRootValue(k, v);
}

export function applyEdit(snapshotId: string, value: LeverValue, routing: RoutingMap): void {
  const m = brandingModel.value;
  if (!m) return;
  const node = m.nodes.find((n) => n.snapshotId === snapshotId);
  if (!node) return;
  // Write edit into facets (the sole brandable field).
  const updatedFacets = leverValueToFacets(value, node.facets);
  setNodeFacets(snapshotId, updatedFacets);
  // re-project only the edited node so color levers update their bound token
  reprojectNodeTokens(snapshotId, updatedFacets, routing);
}
