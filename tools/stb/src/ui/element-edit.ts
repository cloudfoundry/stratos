import type { Facets, FacetValue, LeverValue } from '@/metadata/types';
import type { RoutingMap } from '@/projection/projector';
import { project, projectDark } from '@/projection/projector';
import { brandingModel, setNodeFacets, setNodeVisibility } from '@/state/branding';
import { setRootValue, setDarkValue } from '@/state/tokens';

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
  if (value.kind === 'content') {
    // 'plain'/absent stores no format key — keeps plain content byte-identical
    return { ...existing, content: { text: value.text, ...(value.format === 'subset' ? { format: 'subset' as const } : {}) } };
  }
  if (value.kind === 'asset') return { ...existing, asset: { ref: value.ref } };
  // color: write into text.color if present, else background.color
  const colorFacet: FacetValue = { literal: value.oklch };
  if (existing.text?.color !== undefined) {
    return { ...existing, text: { ...existing.text, color: colorFacet } };
  }
  return { ...existing, background: { ...existing.background, color: colorFacet } };
}

export function reprojectNodeTokens(snapshotId: string, facets: Facets, routing: RoutingMap): void {
  const m = brandingModel.value;
  if (!m) return;
  const node = m.nodes.find((n) => n.snapshotId === snapshotId);
  if (!node) return;
  const { tokens } = project({ scene: m.scene, nodes: [{ ...node, facets }] }, routing);
  for (const [k, v] of tokens) setRootValue(k, v);
}

/** Dark-mode mirror of reprojectNodeTokens: routes node.facetsDark through projectDark
 *  and writes the resulting tokens into the .dark-theme block via setDarkValue. */
export function reprojectNodeTokensDark(
  snapshotId: string,
  facetsDark: Facets,
  routing: RoutingMap,
): void {
  const m = brandingModel.value;
  if (!m) return;
  const node = m.nodes.find((n) => n.snapshotId === snapshotId);
  if (!node) return;
  const tokens = projectDark({ scene: m.scene, nodes: [{ ...node, facetsDark }] }, routing);
  for (const [k, v] of tokens) setDarkValue(k, v);
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
