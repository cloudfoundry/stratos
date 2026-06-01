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

export type CascadeKey =
  | 'org.delete'
  | 'org.create'
  | 'org.update'
  | 'space.delete'
  | 'space.create'
  | 'space.update'
  | 'app.delete'
  | 'app.create'
  | 'app.update'
  | 'route.delete'
  | 'route.create'
  | 'serviceInstance.delete'
  | 'serviceInstance.create'
  | 'serviceInstance.update'
  | 'serviceBinding.delete'
  | 'serviceBinding.create'
  | 'serviceBroker.delete'
  | 'serviceBroker.create';

export const CASCADE_RULES: Readonly<Record<CascadeKey, readonly EntityKind[]>> = {
  // Deleting an org cascades server-side to its spaces, apps, routes,
  // and service instances. All of those slices in EndpointDataService
  // become potentially stale.
  'org.delete': ['spaces', 'apps', 'serviceInstances', 'serviceCredentialBindings'],
  'org.create': [],
  'org.update': [],

  // Deleting a space cascades to its apps, routes, service instances.
  'space.delete': ['apps', 'serviceInstances', 'serviceCredentialBindings'],
  'space.create': [],
  'space.update': [],

  // Apps own their service bindings; deleting an app drops bindings.
  'app.delete': ['serviceCredentialBindings'],
  'app.create': [],
  'app.update': [],

  // Routes attached to apps; deleting affects per-app route lists.
  'route.delete': ['apps'],
  'route.create': ['apps'],

  // Service instance lifecycle affects bound apps.
  'serviceInstance.delete': ['apps', 'serviceCredentialBindings'],
  'serviceInstance.create': [],
  'serviceInstance.update': [],

  // Service bindings link apps ↔ instances.
  'serviceBinding.delete': ['apps', 'serviceInstances'],
  'serviceBinding.create': ['apps', 'serviceInstances'],

  // Broker mutations invalidate offerings + plans (broker catalog).
  'serviceBroker.delete': ['serviceOfferings', 'servicePlans'],
  'serviceBroker.create': ['serviceOfferings', 'servicePlans'],
};

export function cascadeFor(key: CascadeKey): readonly EntityKind[] {
  return CASCADE_RULES[key];
}
