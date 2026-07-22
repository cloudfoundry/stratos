// Real CF parent→child relation descriptors for the signal-native
// entity-relations substrate.
//
// PURPOSE (Increment 1, Task 3 of the common-delete mechanism): give the
// delete chokepoint a *complete* invalidation graph. `affectedSlices()` walks
// these edges to decide which EndpointDataService slices a delete must mark
// stale. The legacy hand-curated `cascade-registry.ts` under-marked — it never
// listed `routes` for an org/space delete — so the migration silently dropped
// the route-list cleanup. Deriving the closure from the same descriptors that
// (will) drive fetch makes the graph the single source of truth.
//
// SCOPE NOTE: these are registered for the *invalidation* graph today. The
// `fetchChildren` impls are intentionally thin — nothing live-fetches through
// SignalRelationFetcherService yet (wave β). They throw loudly rather than
// returning [] so that the first consumer to wire live fetch can't get a
// silent empty result; walkParent() records the throw as a per-relation error.
//
// ENTITY-TYPE VOCABULARY: child types match the keys in
// `affected-slices.ts` ENTITY_TYPE_TO_SLICE. Most align 1:1 with the
// cf-entity-types constants; the one exception is the service-binding edge —
// the legacy constant is `serviceBinding` ('serviceBinding') but the delete
// mechanism uses the CF V3 name `serviceCredentialBinding` (→ slice
// `serviceCredentialBindings`), matching the already-committed slice map. The
// `paramName`s are the legacy v2 CAPI include-relations keys, kept for when
// fetch is wired.

import {
  applicationEntityType,
  organizationEntityType,
  routeEntityType,
  serviceInstancesEntityType,
  spaceEntityType,
} from '../../cf-entity-types';
import type { RelationDescriptor, RelationFetchContext } from './signal-relation-types';
import type { SignalRelationFetcherService } from './signal-relation-fetcher.service';

// CF V3 name for service bindings; no cf-entity-types constant carries this
// value (the legacy `serviceBindingEntityType` is 'serviceBinding'). Keep it
// in lockstep with ENTITY_TYPE_TO_SLICE in affected-slices.ts.
export const serviceCredentialBindingEntityType = 'serviceCredentialBinding';

/** Thin stub: invalidation needs only the parent→child edges, not live fetch. */
const notWired =
  (parentEntityType: string, childEntityType: string) =>
  (_parent: unknown, _ctx: RelationFetchContext): Promise<never> => {
    throw new Error(
      `RelationDescriptor ${parentEntityType}->${childEntityType} is registered for ` +
        `delete invalidation only; live fetchChildren is not wired yet (wave β).`,
    );
  };

const edge = (
  parentEntityType: string,
  childEntityType: string,
  paramName: string,
): RelationDescriptor => ({
  parentEntityType,
  childEntityType,
  paramName,
  isArray: true,
  inlineParentPath: `entity.${paramName}`,
  fetchChildren: notWired(parentEntityType, childEntityType),
});

/**
 * The CF relation graph used to derive delete-invalidation closures. Every
 * server-side cascade of a delete is reachable from these edges:
 *
 *   organization → space → { application, route, serviceInstance }
 *   application  → { route, serviceCredentialBinding }
 *   serviceInstance → serviceCredentialBinding
 */
export const CF_RELATION_DESCRIPTORS: ReadonlyArray<RelationDescriptor> = [
  edge(organizationEntityType, spaceEntityType, 'spaces'),
  edge(spaceEntityType, applicationEntityType, 'apps'),
  edge(spaceEntityType, routeEntityType, 'routes'),
  edge(spaceEntityType, serviceInstancesEntityType, 'service_instances'),
  edge(applicationEntityType, routeEntityType, 'routes'),
  edge(applicationEntityType, serviceCredentialBindingEntityType, 'service_bindings'),
  edge(serviceInstancesEntityType, serviceCredentialBindingEntityType, 'service_bindings'),
];

/** Bulk-register the CF relation descriptors into the fetcher (bootstrap hook). */
export function registerCfRelationDescriptors(fetcher: SignalRelationFetcherService): void {
  fetcher.registerAll(CF_RELATION_DESCRIPTORS);
}
