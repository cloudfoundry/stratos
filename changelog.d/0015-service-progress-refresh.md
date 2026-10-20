[BugFixes]
- Service instance lists and an instance's own page now follow an
  operation that has not ended: while a create, update or delete is
  queued or in progress, they read the instance again every 10
  seconds, so its status changes to the result without a page reload.
  They stop when the operation ends or the page closes. Before, a new
  instance's status stayed at "initial" until the page was reloaded.
- Creating or updating a service instance now marks the services the
  console caches for each endpoint as stale, so their next read
  fetches them again.
