[Features]
- The Foundational Shape page's Compare card gains a named diff: pick two
  detail snapshots — live sections (CF admin only) or exported detail files —
  and see exactly which named organizations, spaces, apps, service instances,
  bindings and role grants appeared, vanished or changed between them,
  before → after. Entities match by guid so renames read as changes, a level
  whose drain never ran on a side reads as not measured rather than deleted,
  and page-capped datasets carry a truncation warning instead of letting the
  cap read as change. Importing a detail file into the anonymous Compare slot
  (or vice versa) now points at the right selector instead of failing
  cryptically.
