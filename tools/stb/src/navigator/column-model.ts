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
