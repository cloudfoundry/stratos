[BugFixes]
- A failed action now gives the reason Cloud Foundry, Jetstream or a proxy
  gave, instead of `Http failure response for <url>: <status>`. This covers
  unmapping and deleting a route, saving and deleting a variable, terminating
  an instance and changing the instance count of an application; start, stop,
  restart, restage and delete in the application lists; delete in the
  organization and space lists and on their summary pages; the last step of
  Create Application; loading, creating and deleting API keys; and the URI
  limit probe on the diagnostics page.
- A role change request that failed as a whole no longer reads
  `Failed to apply role changes: [object Object]`.
- A failed Helm install, upgrade or delete now gives Jetstream's reason, such
  as a release name that is already in use.
- The endpoint errors page, API keys and the setup wizard show an HTML error
  page from a proxy as its heading and message instead of its markup.
