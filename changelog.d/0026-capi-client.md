[Chores]
- Jetstream tracks the upstream `fivetwenty-io/capi/v3` client and no longer carries a fork replace (#5451, #5502). Along the way it picked up typed includes, quota contract fixes, isolation segments, quota-delete jobs and an empty-202 recovery path for managed service instance updates (#5432, #5442, #5443, #5449, #5482).
- Name-uniqueness checks migrated off the CF v2 API (#5591), and a v3-only CF now sources its auth endpoints from the root links when `/v2/info` is absent (#5464).
