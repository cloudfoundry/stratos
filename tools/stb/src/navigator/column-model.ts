import type { LeverValue } from '@/metadata/types';

export interface NavNode {
  snapshotId: string;
  scene: string;
  name: string | null;
  description: string;
  value: LeverValue;
  role?: string;
  roledescription?: string; // the navigator "kind" (page/dialog/stepper/…), from ARIA aria-roledescription
}

export interface PathNode {
  segment: string;
  fullPath: string;
  node?: NavNode;
  displayName?: string; // area (scene) nodes carry the scene's friendly name
  children: Map<string, PathNode>;
}

// Longest common dot-segment prefix across snapshotIds, capped at minDepth-1 so
// no id is fully consumed (every node keeps at least its own leaf segment).
export function commonPrefixLen(ids: string[]): number {
  if (ids.length === 0) return 0;
  const split = ids.map((s) => s.split('.'));
  const cap = Math.min(...split.map((s) => s.length)) - 1;
  let k = 0;
  for (; k < cap; k++) {
    const seg = split[0]![k]!;
    if (!split.every((s) => s[k] === seg)) break;
  }
  return k;
}

// Scenes are the area level (§2.1): root the tree on scene, label it with the
// scene's friendly name, and strip the scene's shared snapshotId prefix so the
// columns beneath read as containers/elements (e.g. Login › Sign in, not
// Login › auth › login › sign-in). Tree addresses are scene-rooted segments.
export function buildPathTree(nodes: NavNode[], sceneNames: Record<string, string> = {}): PathNode {
  const root: PathNode = { segment: '', fullPath: '', children: new Map() };
  const byScene = new Map<string, NavNode[]>();
  for (const n of nodes) {
    const arr = byScene.get(n.scene);
    if (arr) arr.push(n);
    else byScene.set(n.scene, [n]);
  }
  for (const [scene, sceneNodes] of byScene) {
    const prefixLen = commonPrefixLen(sceneNodes.map((n) => n.snapshotId));
    let area = root.children.get(scene);
    if (!area) {
      area = { segment: scene, fullPath: scene, displayName: sceneNames[scene] ?? scene, children: new Map() };
      root.children.set(scene, area);
    }
    for (const n of sceneNodes) {
      let cur = area;
      let path = scene;
      for (const seg of n.snapshotId.split('.').slice(prefixLen)) {
        path = `${path}.${seg}`;
        let child = cur.children.get(seg);
        if (!child) { child = { segment: seg, fullPath: path, children: new Map() }; cur.children.set(seg, child); }
        cur = child;
      }
      cur.node = n;
    }
  }
  return root;
}

// snapshotId → its scene-rooted tree address, so a preview/who-uses-me jump can
// resolve a real walk-back-able column path without re-deriving scene prefixes.
export function indexBySnapshotId(root: PathNode): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const walk = (n: PathNode, segs: string[]): void => {
    if (n.node) out.set(n.node.snapshotId, segs);
    for (const [seg, child] of n.children) walk(child, [...segs, seg]);
  };
  for (const [seg, child] of root.children) walk(child, [seg]);
  return out;
}

// Container kind marker (§2.1a) — read at every level, not just leaves. Keyed on
// the role's name (aria-roledescription), which is the human "kind" of container.
const KIND_GLYPH: Record<string, string> = {
  page: '▭', dialog: '⊞', stepper: '⋯', panel: '▥',
};
export function kindGlyph(roledescription?: string): string | null {
  return roledescription ? KIND_GLYPH[roledescription] ?? null : null;
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
