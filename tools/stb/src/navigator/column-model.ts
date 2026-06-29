import type { LeverValue } from '@/metadata/types';

export interface NavNode {
  snapshotId: string;
  scene: string;
  name: string | null;
  description: string;
  value: LeverValue;
}

export interface PathNode {
  segment: string;
  fullPath: string;
  node?: NavNode;
  children: Map<string, PathNode>;
}

export function buildPathTree(nodes: NavNode[]): PathNode {
  const root: PathNode = { segment: '', fullPath: '', children: new Map() };
  for (const n of nodes) {
    let cur = root;
    let path = '';
    for (const seg of n.snapshotId.split('.')) {
      path = path ? `${path}.${seg}` : seg;
      let child = cur.children.get(seg);
      if (!child) { child = { segment: seg, fullPath: path, children: new Map() }; cur.children.set(seg, child); }
      cur = child;
    }
    cur.node = n;
  }
  return root;
}

export function nodeAt(root: PathNode, segs: string[]): PathNode | null {
  let cur: PathNode | undefined = root;
  for (const s of segs) { cur = cur?.children.get(s); if (!cur) return null; }
  return cur ?? null;
}

export interface ColumnView {
  parent: PathNode;
  activeSeg: string | null;
  collapsed: boolean;
}

// LIFO stack: drill pushes, back pops the newest. The path IS the recorded position.
export const push = (path: string[], seg: string): string[] => [...path, seg];
export const pop = (path: string[]): string[] => path.slice(0, -1);
export const truncate = (path: string[], depth: number): string[] => path.slice(0, depth);
export const jumpTo = (snapshotId: string): string[] => snapshotId.split('.');

export function computeColumns(root: PathNode, path: string[], keepFull = 2): ColumnView[] {
  const out: { parent: PathNode; activeSeg: string | null }[] = [];
  out.push({ parent: root, activeSeg: path[0] ?? null });
  for (let k = 0; k < path.length; k++) {
    const parent = nodeAt(root, path.slice(0, k + 1));
    if (!parent || parent.children.size === 0) break; // leaf — no further column
    out.push({ parent, activeSeg: path[k + 1] ?? null });
  }
  const fullFrom = Math.max(0, out.length - keepFull);
  return out.map((c, i) => ({ ...c, collapsed: i < fullFrom }));
}
