import type { ElementNode } from '@/metadata/types';

export function emitCss(root: Map<string, string>, dark: Map<string, string>): string {
  const parts: string[] = [];
  if (root.size > 0) parts.push(block(':root', root));
  if (dark.size > 0) parts.push(block('.dark-theme', dark));
  return parts.join('\n\n');
}

// R1 facet escape hatch: one `[stb-snapshot-id="…"] { … }` rule per element
// carrying a scoped block, ordered by snapshotId so output is deterministic.
// These do NOT round-trip through parseCss (it reads only :root/.dark-theme).
export function emitScopedBlocks(nodes: ElementNode[]): string {
  return nodes
    .filter((n) => n.scopedBlock && n.scopedBlock.trim())
    .sort((a, b) => a.snapshotId.localeCompare(b.snapshotId))
    .map((n) => {
      const body = n.scopedBlock!.trim().split('\n').map((l) => `  ${l.trim()}`).join('\n');
      return `[stb-snapshot-id="${n.snapshotId}"] {\n${body}\n}`;
    })
    .join('\n\n');
}

function block(selector: string, values: Map<string, string>): string {
  const keys = [...values.keys()].sort();
  const lines = keys.map((k) => `  ${k}: ${values.get(k)};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}
