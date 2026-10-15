[Features]
- The service instance wizard no longer waits on a slow broker for as
  long as it takes. After 30 seconds it closes, says the operation
  carries on and names where to watch it (the Services list, or the
  application's Services tab). The outcome is still reported wherever
  you are; a failure stays on screen until dismissed. Leaving the wizard
  early hands the operation off the same way.

[BugFixes]
- An operation whose result Stratos could not determine is no longer
  reported as a success. Waiting for a background operation used to end
  at the first failed status check (a network blip, a backend restart),
  and the screen then said "created" or "deleted" regardless. Status
  checks now carry on through transient errors, and an operation that
  really ended without a known result says so and names where to see
  the current state.
- Any Stratos instance behind a load balancer can answer for an
  operation another instance started, so a status check no longer fails
  when it reaches a different instance or one that restarted.
- An operation's status is shown only to the user who started it.
- Creating a service binding or service key now reports the broker's
  failure when the broker fails the operation after accepting it, as
  service instances already did.
- The service instance wizard names the instance in its messages. It
  said `Service instance "Service instance" created.`, named a renamed
  instance by its old name, and said "created and bound" when binding an
  existing instance.
- The backend no longer keeps an unfinished operation in memory forever
  once nobody is checking on it: after an hour without a status check it
  is dropped. An operation someone keeps checking is kept however long it
  takes.

[Maintainability]
- Removed the long-running request path from the backend proxy. Nothing
  has sent its `x-cap-long-running` header since the service instance
  actions that used it were replaced; Cloud Foundry v3 answers those
  writes with a background job instead. The
  `HTTP_CLIENT_TIMEOUT_LONGRUNNING_IN_SECS` setting is gone from the
  shipped configs and Helm chart; a deployment that still sets it is
  unaffected, as the value is ignored.
