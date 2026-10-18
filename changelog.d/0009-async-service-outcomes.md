[Features]
- The service instance wizard no longer waits on a slow broker for as
  long as it takes. After 30 seconds it says how long the operation has
  been running and asks whether to keep waiting, for 30 seconds up to 10
  minutes, or to continue in the background. Without an answer within 30
  seconds, or when you choose to, it closes, says the operation carries
  on and names where to watch it (the Services list, or the
  application's Services tab). The outcome is still reported wherever
  you are; a failure stays on screen until dismissed. Leaving the wizard
  early hands the operation off the same way.
- A service instance create or update handed off by the wizard is still
  reported after a page reload or a new sign-in, signing out included:
  Stratos says it is still running and for how long, then how it ended.
  Only the wizard's create and update are kept this way; a bind, key,
  delete or bulk operation that is still running when the page reloads
  is not reported afterwards. If the session ends while one runs and the
  page stays open (the session expired, or you signed out in another
  tab), Stratos says its status will show after you sign in. With
  several tabs open, one tab reports it; another takes over if that tab
  closes.
  The "still running" or "carries on in the background" message is taken
  down when the message saying how it ended appears.
- Stratos stops following a background operation (a slow broker, a
  delete Cloud Foundry runs as a job) after a set time, 60 minutes by
  default, and says it is still running in Cloud Foundry rather than
  that it failed or that its result is unknown. A restage or rollback is
  followed to the end, since Stratos itself moves it along. Set
  ASYNC_JOB_TRACKING_LIMIT_IN_MINS (Helm: console.ui.jobTrackingLimitMins)
  to change it; under 1 uses 1, over 360 logs a warning, 1440 or more
  uses 360.
- The backend logs a "job ended" line for each background operation,
  with its kind, outcome and how long it took, so an operator can set
  the tracking limit from their own foundation's numbers.

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
  service instances already did, in the broker's own words rather than
  Cloud Foundry's internal error name.
- The service instance wizard names the instance in its messages,
  failures included. It said `Service instance "Service instance"
  created.`, named a renamed instance by its old name, and said "created
  and bound" when binding an existing instance. A bind that fails after
  the instance was created now says the instance was created.
- A bulk delete or unmap that partly fails names each item that failed
  and gives the reason, and names any whose result could not be
  determined. It said only how many failed.
- Deleting an application from its row menu with "Also delete this
  application's routes and service bindings" reports how it ended, as a
  multi-select delete does. A failure used to go unreported.
- Background operations are checked less often the longer they run:
  every few seconds at first, then up to every two minutes.
- Starting, stopping, restarting, restaging or scaling an application
  whose result could not be determined is no longer reported as done.
- An application action that fails in Cloud Foundry after it was
  accepted (a delete, start, stop, restart or restage from the
  application page) gives the reason Cloud Foundry gave, not its
  internal error name such as CF-UnableToPerform.
- Deleting an application reached by its delete URL (a bookmark or a
  refresh) no longer asks about, and reports on, org "?" / space "?"
  when Confirm is pressed before their names have loaded.
- A setting given a value that does not parse (text for a number, say)
  still stops the backend at startup, and the error now names the
  setting.
- Screen readers read out pop-up messages, errors first, and name their
  close button. They were silent before.
- The service instance wizard's "still running" question takes focus
  when it appears, so a screen reader reads it out and it can be
  answered from the keyboard.
- ASYNC_JOB_TRACKING_LIMIT_IN_MINS=0 follows jobs for 1 minute, as for
  any value under 1, rather than the 60-minute default it got by being
  mistaken for unset.
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
- The library type checks pass again (TypeScript 6.0 had broken them
  all) and now run in the gate and on every pull request.
