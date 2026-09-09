[BugFixes]
- The org Spaces tab no longer offers Create Space to roles that cannot create
  one; only an org manager sees it, matching the other create actions.

[Maintainability]
- The e2e suite can run as CF roles: org manager, space manager, org auditor
  and space auditor each get their own console session and a suite asserting
  what the console lets them do and what it refuses, with canary tests that
  must fail so a leaked control turns the run red. Role-gated controls carry
  stable test hooks; app creation in the API helper no longer names a stack
  the foundation may not have.
