[BugFixes: Endpoints]
- The Endpoints page shows its loading message or its content straight
  away. It used to show nothing for half a second, and every later
  change appeared half a second late.
- The Endpoints page Register button and the endpoint card Creator row
  follow the user endpoints setting. They kept the value from the
  first page load.
- The Register Endpoint tiles stay current as endpoints are added and
  removed. They kept the first list they were shown.
- The home page endpoint card shows its links once they load. An empty
  links panel could stay on screen.
----
[BugFixes: Metrics]
- The Metrics page shows its "provides no metadata file" notice again.
----
[BugFixes: Applications]
- The new application route step shows the domains of the organization
  picked last. A slower answer for an earlier organization could
  replace them.
----
[BugFixes: Services]
- In the add service instance wizard, a failed fetch of the space's
  applications no longer stops later fetches: changing the space
  fetches them again.
- The plan step picks its plan once each time it is entered, not twice.
----
[BugFixes: Organizations and Spaces]
- A space's Quota tab follows the space's quota. It showed the quota
  from when the page opened, and a removed quota stayed on screen.
----
[BugFixes: Users and Roles]
- In Manage Users, Next on the role steps follows the selection without
  a delay.
- Manage Roles no longer accepts a role change while the user's roles
  are still loading. A change made then enabled Next and confirmed
  against an organization with no name.
- Manage Roles keeps Next disabled until a role differs from what the
  user holds, and disables it again when the changes are undone.
----
[BugFixes: Kubernetes]
- The Kubernetes home card waits for its pod, node and namespace counts
  instead of showing 0 until they arrive.
----
[BugFixes: Helm]
- A Helm release's resource graph redraws on every update. It redrew
  only on the first.
- A Helm release's graph and summary show the analysis report picked
  last. An earlier, slower report could replace it.
- The Helm catalog's Artifact Hub badge follows the connected endpoints.
  It stayed off when the catalog opened before the endpoints loaded.
----
[Maintainability]
- State that pages read is held in signals across Cloud Foundry, core,
  Kubernetes, Helm and the autoscaler: Observable wrappers around
  signals, and the template subscriptions that read them, are removed.
  Timing workarounds that delayed values by a tick or half a second are
  gone, as are unused services, members and watchers that outlived the
  rows or steps that created them.
- The application detail data service reads with `httpResource`.
- `SessionService`, `KubernetesNamespacesFilterService` and the unused
  Observable members of the metrics service are removed.
