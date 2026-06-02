// Central declaration of which entity slices a mutation invalidates
// beyond its own slice. Sources call EndpointDataService.applyCascade(key)
// after a successful mutation; the service walks the entries here and
// flips the corresponding stale flag for each.
//
// Adding a mutation: add a new CascadeKey entry below. Keep the rule
// list tight — only entities whose server-side state is affected by
// this mutation belong here. Over-marking forces unnecessary refetches
// when the user navigates; under-marking leaves UI stale (the original
// bug class).

export type EntityKind =
  | 'orgs'
  | 'apps'
  | 'spaces'
  | 'routes'
  | 'serviceInstances'
  | 'serviceOfferings'
  | 'servicePlans'
  | 'serviceBrokers'
  | 'serviceCredentialBindings';

// NOTE: entity *delete* cascades now derive from the relation graph via
// EntityDeleteController (affectedSlices ∪ referencingSlices), so the
// org/space/app/serviceInstance/serviceBinding `.delete` keys were removed —
// nothing dispatches them anymore. `route.delete` stays: it's still fired by
// route *unmap* (CnsiRoutesSource.unmapApp), a relationship op that isn't an
// entity delete. create/update cascades still flow through applyCascade.
// (serviceBroker.* remain as dormant scaffolding for the parked broker UI.)
export type CascadeKey =
  | 'org.create'
  | 'org.update'
  | 'space.create'
  | 'space.update'
  | 'app.create'
  | 'app.update'
  | 'route.delete'
  | 'route.create'
  | 'serviceInstance.create'
  | 'serviceInstance.update'
  | 'serviceBinding.create'
  | 'serviceBroker.delete'
  | 'serviceBroker.create';

export const CASCADE_RULES: Readonly<Record<CascadeKey, readonly EntityKind[]>> = {
  'org.create': [],
  'org.update': [],

  'space.create': [],
  'space.update': [],

  'app.create': [],
  'app.update': [],

  // Route unmap (relationship op) affects per-app route lists.
  'route.delete': ['apps'],
  'route.create': ['apps'],

  'serviceInstance.create': [],
  'serviceInstance.update': [],

  // Service bindings link apps ↔ instances.
  'serviceBinding.create': ['apps', 'serviceInstances'],

  // Broker mutations invalidate offerings + plans (broker catalog).
  'serviceBroker.delete': ['serviceOfferings', 'servicePlans'],
  'serviceBroker.create': ['serviceOfferings', 'servicePlans'],
};

export function cascadeFor(key: CascadeKey): readonly EntityKind[] {
  return CASCADE_RULES[key];
}
