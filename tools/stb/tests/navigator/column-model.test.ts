import { describe, it, expect } from 'vitest';
import { buildPathTree, nodeAt, computeColumns, push, pop, truncate, jumpTo, type NavNode } from '@/navigator/column-model';

const nodes: NavNode[] = [
  { snapshotId: 'auth.login.page', scene: 'login', name: 'Login page', description: '', value: { kind: 'color', oklch: { l: 0.97, c: 0.01, h: 250 } } },
  { snapshotId: 'auth.login.sign-in', scene: 'login', name: 'Sign in', description: '', value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } } },
  { snapshotId: 'cf.applications.app-card-1.status', scene: 'app-list', name: 'Status', description: '', value: { kind: 'color', oklch: { l: 0.7, c: 0.17, h: 145 } } },
];

describe('buildPathTree', () => {
  it('merges scenes into top-level segments by shared prefix', () => {
    const root = buildPathTree(nodes);
    expect([...root.children.keys()]).toEqual(['auth', 'cf']);
  });
  it('attaches each NavNode at its leaf path', () => {
    const root = buildPathTree(nodes);
    expect(nodeAt(root, ['auth', 'login', 'sign-in'])?.node?.name).toBe('Sign in');
  });
  it('creates intermediate segments without a node', () => {
    const root = buildPathTree(nodes);
    expect(nodeAt(root, ['cf', 'applications'])?.node).toBeUndefined();
    expect(nodeAt(root, ['cf', 'applications', 'app-card-1', 'status'])?.node?.scene).toBe('app-list');
  });
  it('nodeAt returns null for an unknown path', () => {
    expect(nodeAt(buildPathTree(nodes), ['nope'])).toBeNull();
  });
});

describe('LIFO stack helpers', () => {
  it('push appends, pop removes the newest (LIFO)', () => {
    expect(push(['auth'], 'login')).toEqual(['auth', 'login']);
    expect(pop(['auth', 'login', 'sign-in'])).toEqual(['auth', 'login']);
    expect(pop([])).toEqual([]);
  });
  it('truncate walks back to a recorded depth (rail click)', () => {
    expect(truncate(['auth', 'login', 'sign-in'], 1)).toEqual(['auth']);
    expect(truncate(['auth', 'login'], 0)).toEqual([]);
  });
  it('jumpTo records a full path from a snapshotId', () => {
    expect(jumpTo('auth.login.sign-in')).toEqual(['auth', 'login', 'sign-in']);
  });
});

describe('computeColumns (collapse-to-rail)', () => {
  const root = buildPathTree(nodes);
  it('shows one full column at the root', () => {
    const cols = computeColumns(root, []);
    expect(cols).toHaveLength(1);
    expect(cols[0]!.collapsed).toBe(false);
    expect([...cols[0]!.parent.children.keys()]).toEqual(['auth', 'cf']);
  });
  it('keeps the last two columns full, collapses older to rails', () => {
    const cols = computeColumns(root, ['cf', 'applications', 'app-card-1']);
    // levels: root(cf) | cf(applications) | applications(app-card-1) | app-card-1(children)
    expect(cols.map((c) => c.collapsed)).toEqual([true, true, false, false]);
    expect(cols[cols.length - 1]!.parent.fullPath).toBe('cf.applications.app-card-1');
  });
  it('stops descending at a leaf (no empty trailing column)', () => {
    const cols = computeColumns(root, ['auth', 'login', 'sign-in']);
    expect(cols.map((c) => c.parent.fullPath)).toEqual(['', 'auth', 'auth.login']);
  });
});
