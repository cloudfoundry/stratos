import type { LeverValue } from '@/metadata/types';
import type { RoutingMap } from '@/projection/projector';
import { project } from '@/projection/projector';
import { brandingModel, setNodeValue } from '@/state/branding';
import { setRootValue } from '@/state/tokens';

export function companionVisibilityId(snapshotId: string): string {
  return snapshotId.replace(/\.([^.]+)$/, '.show-$1');
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
