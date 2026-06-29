import { describe, it, expect } from 'vitest';
import {
  buildPathTree, nodeAt, computeColumns, push, pop, truncate,
  commonPrefixLen, indexBySnapshotId, kindGlyph, type NavNode,
} from '@/navigator/column-model';

const nodes: NavNode[] = [
  { snapshotId: 'auth.login.page', scene: 'login', name: 'Login page', description: '', value: { kind: 'color', oklch: { l: 0.97, c: 0.01, h: 250 } } },
  { snapshotId: 'auth.login.sign-in', scene: 'login', name: 'Sign in', description: '', value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } } },
  { snapshotId: 'cf.applications.heading', scene: 'app-list', name: 'Heading', description: '', value: { kind: 'content', text: 'Applications' } },
  { snapshotId: 'cf.applications.app-card-1.status', scene: 'app-list', name: 'Status', description: '', value: { kind: 'color', oklch: { l: 0.7, c: 0.17, h: 145 } } },
];
const names = { login: 'Login', 'app-list': 'App list' };

describe('commonPrefixLen', () => {
  it('finds the shared dot-prefix, capped so a leaf always remains', () => {
    expect(commonPrefixLen(['auth.login.page', 'auth.login.sign-in'])).toBe(2);
    expect(commonPrefixLen(['shared.confirm-dialog', 'shared.stepper'])).toBe(1);
    expect(commonPrefixLen(['a.b.c'])).toBe(2);   // single id → keep its leaf
    expect(commonPrefixLen([])).toBe(0);
  });
});

describe('buildPathTree (scenes-as-area)', () => {
  it('roots on scene id, labelled with the scene name', () => {
    const root = buildPathTree(nodes, names);
    expect([...root.children.keys()]).toEqual(['login', 'app-list']);
    expect(root.children.get('login')?.displayName).toBe('Login');
  });
  it('strips the scene prefix so children read as containers/elements', () => {
    const root = buildPathTree(nodes, names);
    expect([...root.children.get('login')!.children.keys()]).toEqual(['page', 'sign-in']);
    expect(nodeAt(root, ['login', 'sign-in'])?.node?.name).toBe('Sign in');
  });
  it('keeps intermediate containers as nodeless segments', () => {
    const root = buildPathTree(nodes, names);
    expect(nodeAt(root, ['app-list', 'app-card-1'])?.node).toBeUndefined();
    expect(nodeAt(root, ['app-list', 'app-card-1', 'status'])?.node?.scene).toBe('app-list');
  });
});

describe('indexBySnapshotId', () => {
  it('maps each snapshotId to its scene-rooted tree address', () => {
    const idx = indexBySnapshotId(buildPathTree(nodes, names));
    expect(idx.get('auth.login.sign-in')).toEqual(['login', 'sign-in']);
    expect(idx.get('cf.applications.app-card-1.status')).toEqual(['app-list', 'app-card-1', 'status']);
  });
});

describe('kindGlyph', () => {
  it('returns a marker for each container kind, null otherwise', () => {
    expect(kindGlyph('dialog')).toBe('⊞');
    expect(kindGlyph('stepper')).toBe('⋯');
    expect(kindGlyph('page')).toBe('▭');
    expect(kindGlyph('region')).toBeNull();   // not a container "kind" → no glyph
    expect(kindGlyph(undefined)).toBeNull();
  });
});

describe('LIFO stack helpers', () => {
  it('push appends, pop removes the newest (LIFO)', () => {
    expect(push(['login'], 'sign-in')).toEqual(['login', 'sign-in']);
    expect(pop(['login', 'sign-in'])).toEqual(['login']);
    expect(pop([])).toEqual([]);
  });
  it('truncate walks back to a recorded depth (rail click)', () => {
    expect(truncate(['app-list', 'app-card-1', 'status'], 1)).toEqual(['app-list']);
    expect(truncate(['login'], 0)).toEqual([]);
  });
});

describe('computeColumns (collapse-to-rail)', () => {
  const root = buildPathTree(nodes, names);
  it('shows one full column at the root (the area list)', () => {
    const cols = computeColumns(root, []);
    expect(cols).toHaveLength(1);
    expect(cols[0]!.collapsed).toBe(false);
    expect([...cols[0]!.parent.children.keys()]).toEqual(['login', 'app-list']);
  });
  it('keeps the last two columns full, collapses older to rails', () => {
    const cols = computeColumns(root, ['app-list', 'app-card-1']);
    // levels: root(areas) | app-list(app-card-1) | app-card-1(status)
    expect(cols.map((c) => c.collapsed)).toEqual([true, false, false]);
    expect(cols[cols.length - 1]!.parent.fullPath).toBe('app-list.app-card-1');
  });
  it('stops descending at a leaf (no empty trailing column)', () => {
    const cols = computeColumns(root, ['login', 'sign-in']);
    expect(cols.map((c) => c.parent.fullPath)).toEqual(['', 'login']);
  });
});
