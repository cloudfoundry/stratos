[Maintainability]
- Permission checks are signals end to end: the checkers are computed
  from the current user's role, scope and feature flag signals, and
  `can()` returns a signal that pages and directives read directly.
  The stream versions of the checks and the role wrapper services are
  gone.

[BugFixes: Users and Roles]
- In Manage Roles, each space's role options follow that space's
  permission. Before, the per-space checks could overwrite each other
  and show the wrong space as editable.

[BugFixes: Applications]
- The application Variables tab no longer shows briefly to users who
  may not view environment variables.
- Deploy Application reuses the Cloud Foundry feature flags already
  loaded to decide whether Docker images are allowed, instead of
  requesting them again.

[BugFixes: Cloud Foundry]
- The Cloud Foundry name in a service card breadcrumb appears or goes
  away when a second Cloud Foundry is connected or disconnected,
  without reloading the page.
