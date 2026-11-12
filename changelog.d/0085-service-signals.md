[Maintainability]
- The services behind the Cloud Foundry, organization, space,
  Kubernetes, endpoint list, shell (profile, notifications, tabs,
  history, recent activity, favorites) and wizard pages expose their
  state as signals, and the pages read the signals directly. The
  Observable copies of that state are gone. Requests (counts, quotas,
  dashboard status) stay streams that each page subscribes to.

[BugFixes: Cloud Foundry]
- The recently updated applications card on the Cloud Foundry summary
  shows the newest apps as soon as the summary loads, instead of
  "There are no applications" until the full app list arrives.
- "View organization's quota" on the space summary card navigates once
  per click; it used to navigate again whenever the quota reloaded.
- The space page and CLI Info breadcrumbs follow an organization or
  space rename instead of keeping the first name.

[BugFixes: Kubernetes]
- The node tags card no longer fails on a node without that metadata.
- The cluster summary shows "-" for the node version when no node
  reports one, instead of a blank.

[BugFixes: Core]
- A failed favorites load no longer raises an error on every page that
  reads favorites; they show as empty and the failure is logged once.
- The favorite star shows its state from the first frame.
