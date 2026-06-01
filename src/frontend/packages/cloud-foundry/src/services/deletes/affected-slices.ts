// Pure helper: derive the full transitive set of EDS slice names whose
// lists can be invalidated by deleting an entity of `rootEntityType`.
//
// CLOSURE APPROACH: direct registry walk (not buildSignalRelationTree).
//
// buildSignalRelationTree filters by an `includeRelations` allowlist —
// if we used it we would have to first enumerate all reachable relation
// keys (a graph walk), then call buildSignalRelationTree with that set
// (another graph walk). That's two passes over the same graph for no
// benefit. Walking the registry directly in one DFS pass is simpler,
// requires no external state, and is easier to follow. It also avoids
// the tree cache side-effects which would pollute other tests if we
// called buildSignalRelationTree here.
//
// Guard against cycles: track visited entity types in a Set<string>.
// Because we only care about which types are reachable (not the relation
// key path), a simple "have we started processing this type?" guard is
// sufficient — we stop the DFS as soon as we see a type we've already
// enqueued.

import type { RelationDescriptorRegistry } from '../../entity-relations/signal/signal-relation-tree';

// ---------------------------------------------------------------------------
// entityType → EDS slice name map
//
// `childEntityType` in RelationDescriptor uses EntitySchema-style singular
// names.  EDS slices in EndpointDataService / cascade-registry.ts use the
// plural collection key.  This map is the single translation table; keep it
// documented and complete.  `routes` is included even though EntityKind does
// not yet list it — the graph tells the truth and the EDS gap is a downstream
// task (see cascade-registry.ts TODO).
// ---------------------------------------------------------------------------

export const ENTITY_TYPE_TO_SLICE: Readonly<Record<string, string>> = {
  organization:              'orgs',
  space:                     'spaces',
  application:               'apps',
  route:                     'routes',
  serviceInstance:           'serviceInstances',
  serviceOffering:           'serviceOfferings',
  servicePlan:               'servicePlans',
  serviceBroker:             'serviceBrokers',
  serviceCredentialBinding:  'serviceCredentialBindings',
};

/**
 * Return the de-duplicated set of EDS slice names for every entity type
 * transitively reachable as a **child** of `rootEntityType` in the
 * registered relation graph.  These are the slices whose lists a delete
 * of `rootEntityType` can invalidate.
 *
 * Pure and synchronous — no Angular, no HTTP, no signals.
 */
export function affectedSlices(
  rootEntityType: string,
  registry: RelationDescriptorRegistry,
): string[] {
  const slices: string[] = [];
  // visited tracks entity types we have already started expanding so we
  // terminate on cycles (org→space→org) and avoid duplicate expansions.
  const visited = new Set<string>();

  function walk(entityType: string): void {
    if (visited.has(entityType)) {
      return;
    }
    visited.add(entityType);

    const children = registry.get(entityType);
    if (!children) {
      return;
    }

    for (const descriptor of children) {
      const slice = ENTITY_TYPE_TO_SLICE[descriptor.childEntityType];
      if (slice && !slices.includes(slice)) {
        slices.push(slice);
      }
      // Recurse regardless of whether we know the slice name — the child
      // may itself have further children we need to collect.
      walk(descriptor.childEntityType);
    }
  }

  walk(rootEntityType);
  return slices;
}
