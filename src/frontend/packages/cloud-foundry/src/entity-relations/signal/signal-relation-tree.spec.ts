import { describe, it, expect, beforeEach } from 'vitest';
import {
  _resetSignalRelationTreeCache,
  buildSignalRelationTree,
  indexDescriptors,
} from './signal-relation-tree';
import { RelationDescriptor, signalRelationKey } from './signal-relation-types';

// Mirrors `entity-relations.tree.spec.ts`. Six cases that walk the
// pure tree builder against a synthetic registry to prove maxDepth +
// requiredParamNames + filtering by includeRelations match the legacy
// shape exactly.

describe('Signal Entity Relations - Tree', () => {
  const PARENT = 'parent';
  const CHILD1 = 'child1';
  const CHILD2 = 'child2';

  const noopFetch = () => Promise.resolve([]);

  beforeEach(() => _resetSignalRelationTreeCache());

  it('no relations', () => {
    const registry = indexDescriptors([]);
    const res = buildSignalRelationTree(PARENT, registry, []);
    expect(res.maxDepth).toBe(0);
    expect(res.requiredParamNames.length).toBe(0);
  });

  it('relation depth of 1, no relations', () => {
    const registry = indexDescriptors([
      { parentEntityType: PARENT, childEntityType: CHILD1, paramName: 'rel1', isArray: false, fetchChildren: noopFetch },
    ]);
    const res = buildSignalRelationTree(PARENT, registry, []);
    expect(res.maxDepth).toBe(0);
    expect(res.requiredParamNames.length).toBe(0);
  });

  it('relation depth of 1 with relations (key)', () => {
    const desc: RelationDescriptor = {
      parentEntityType: PARENT, childEntityType: CHILD1, paramName: 'rel1', isArray: false, fetchChildren: noopFetch,
    };
    const registry = indexDescriptors([desc]);
    const includes = [signalRelationKey(PARENT, CHILD1)];
    const res = buildSignalRelationTree(PARENT, registry, includes, false);
    expect(res.maxDepth).toBe(1);
    expect(res.requiredParamNames.length).toBe(1);
    expect(res.requiredParamNames).toEqual(['rel1']);
    expect(res.relationKeys).toEqual([signalRelationKey(PARENT, CHILD1)]);
  });

  it('relation depth of 1 with relations (type)', () => {
    const desc: RelationDescriptor = {
      parentEntityType: PARENT, childEntityType: CHILD1, paramName: CHILD1, isArray: false, fetchChildren: noopFetch,
    };
    const registry = indexDescriptors([desc]);
    const includes = [signalRelationKey(PARENT, CHILD1)];
    const res = buildSignalRelationTree(PARENT, registry, includes, false);
    expect(res.maxDepth).toBe(1);
    expect(res.requiredParamNames.length).toBe(1);
    expect(res.requiredParamNames).toEqual([CHILD1]);
  });

  it('relation depth of 2 with relations', () => {
    const registry = indexDescriptors([
      { parentEntityType: PARENT, childEntityType: CHILD1, paramName: CHILD1, isArray: true, fetchChildren: noopFetch },
      { parentEntityType: CHILD1, childEntityType: CHILD2, paramName: CHILD2, isArray: true, fetchChildren: noopFetch },
    ]);
    const includes = [
      signalRelationKey(PARENT, CHILD1),
      signalRelationKey(CHILD1, CHILD2),
    ];
    const res = buildSignalRelationTree(PARENT, registry, includes, false);
    expect(res.maxDepth).toBe(2);
    expect(res.requiredParamNames.length).toBe(2);
    expect(res.requiredParamNames).toEqual([CHILD1, CHILD2]);
    expect(res.rootRelations).toHaveLength(1);
    expect(res.rootRelations[0].childRelations).toHaveLength(1);
    expect(res.rootRelations[0].childRelations[0].childEntityType).toBe(CHILD2);
  });

  it('relation depth of 2 without relations', () => {
    const registry = indexDescriptors([
      { parentEntityType: PARENT, childEntityType: CHILD1, paramName: CHILD1, isArray: true, fetchChildren: noopFetch },
      { parentEntityType: CHILD1, childEntityType: CHILD2, paramName: CHILD2, isArray: true, fetchChildren: noopFetch },
    ]);
    const res = buildSignalRelationTree(PARENT, registry, [], false);
    expect(res.maxDepth).toBe(0);
    expect(res.requiredParamNames.length).toBe(0);
  });
});
