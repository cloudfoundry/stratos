import type { LeverValue } from '@/metadata/types';
import type { RoutingMap } from '@/projection/projector';
import { project } from '@/projection/projector';
import { brandingModel, setNodeValue, setNodeVisibility } from '@/state/branding';
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

export function applyEdit(snapshotId: string, value: LeverValue, routing: RoutingMap): void {
  setNodeValue(snapshotId, value);
  const m = brandingModel.value;
  if (!m) return;
  // re-project only the edited node so color levers update their bound token
  const node = m.nodes.find((n) => n.snapshotId === snapshotId);
  if (!node) return;
  const { tokens } = project({ scene: m.scene, nodes: [node] }, routing);
  for (const [k, v] of tokens) setRootValue(k, v);
}
