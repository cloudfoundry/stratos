import { describe, it, expect } from 'vitest';
import { buildPathTree, nodeAt, type NavNode } from '@/navigator/column-model';

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
