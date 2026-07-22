// Pure tree builder for the signal-native entity-relations substrate.
//
// Mirrors `entity-relations.tree.ts` (fetchEntityTree + parseEntityTree)
// without any EntitySchema knowledge — instead it walks a registry of
// RelationDescriptor entries keyed by (parentEntityType -> child[]). The
// result is a SignalRelationTree carrying maxDepth + ordered relation
// keys + a node graph that mirrors EntityTree.rootRelation.childRelations.
//
// Cached by `rootEntityType + sorted(includeRelations).join(',')` to
// match the legacy cache key shape — same hit-rate characteristics, same
// invalidation surface.

import {
  RelationDescriptor,
  signalRelationKey,
  SignalRelationNode,
  SignalRelationTree,
} from './signal-relation-types';

/** Map descriptors by parent entity type for fast lookup during the walk. */
export type RelationDescriptorRegistry = ReadonlyMap<string, ReadonlyArray<RelationDescriptor>>;

const treeCache = new Map<string, SignalRelationTree>();

function cacheKey(rootEntityType: string, includeRelations: string[]): string {
  const sorted = [...includeRelations].sort((a, b) => a.localeCompare(b)).join(',');
  return `${rootEntityType}+${sorted}`;
}

/** Convenience: build a registry from a flat descriptor list. */
export function indexDescriptors(descriptors: ReadonlyArray<RelationDescriptor>): RelationDescriptorRegistry {
  const map = new Map<string, RelationDescriptor[]>();
  for (const d of descriptors) {
    const list = map.get(d.parentEntityType);
    if (list) {
      list.push(d);
    } else {
      map.set(d.parentEntityType, [d]);
    }
  }
  return map;
}

/**
 * Build a SignalRelationTree for the requested root + include-relations
 * filter. Equivalent of legacy `fetchEntityTree(action)` but takes a
 * descriptor registry rather than a normalizr schema and an action.
 *
 * Caching: by default the result is cached on (rootEntityType +
 * sorted(includeRelations)). Pass `fromCache=false` to bypass — useful
 * in tests and when the registry has been re-registered mid-run.
 */
export function buildSignalRelationTree(
  rootEntityType: string,
  registry: RelationDescriptorRegistry,
  includeRelations: ReadonlyArray<string> = [],
  fromCache = true,
): SignalRelationTree {
  const includes = [...includeRelations];
  const key = cacheKey(rootEntityType, includes);
  if (fromCache) {
    const cached = treeCache.get(key);
    if (cached) {
      return cached;
    }
  }

  const requiredParamNames: string[] = [];
  const relationKeys: string[] = [];

  // Walks the registry transitively, only following descriptors whose
  // (parent-child) relation key is in the include filter. Tracks visited
  // composite keys to break cycles (an org -> space -> org link, for
  // instance, would otherwise recurse forever).
  const visited = new Set<string>();
  function walk(parentType: string, depth: number): { children: SignalRelationNode[]; subtreeDepth: number } {
    const descriptors = registry.get(parentType) || [];
    let subtreeDepth = depth;
    const children: SignalRelationNode[] = [];

    for (const descriptor of descriptors) {
      const relationKey = signalRelationKey(parentType, descriptor.childEntityType);
      if (!includes.includes(relationKey)) {
        continue;
      }
      const cycleKey = `${parentType}>${descriptor.childEntityType}@${depth}`;
      if (visited.has(cycleKey)) {
        continue;
      }
      visited.add(cycleKey);

      if (!requiredParamNames.includes(descriptor.paramName)) {
        requiredParamNames.push(descriptor.paramName);
      }
      if (!relationKeys.includes(relationKey)) {
        relationKeys.push(relationKey);
      }

      const { children: grandChildren, subtreeDepth: childSubtreeDepth } = walk(
        descriptor.childEntityType,
        depth + 1,
      );
      subtreeDepth = Math.max(subtreeDepth, childSubtreeDepth);

      children.push({
        parentEntityType: parentType,
        childEntityType: descriptor.childEntityType,
        paramName: descriptor.paramName,
        isArray: descriptor.isArray,
        relationKey,
        descriptor,
        childRelations: grandChildren,
      });
    }

    return { children, subtreeDepth };
  }

  const { children: rootChildren, subtreeDepth } = walk(rootEntityType, 0);

  const tree: SignalRelationTree = {
    rootEntityType,
    // maxDepth in the legacy pipeline is the number of relation hops
    // beneath the root. With no children that's 0 (matching legacy).
    maxDepth: subtreeDepth,
    requiredParamNames,
    relationKeys,
    rootRelations: rootChildren,
  };

  treeCache.set(key, tree);
  return tree;
}

/** Test-only hook to drop the cache between specs. */
export function _resetSignalRelationTreeCache(): void {
  treeCache.clear();
}
