[Features]
- The performance page now measures what Stratos actually controls: the
  headline splits initial-load from since-load activity, a document-fetch
  phase row covers the gap before Angular boots, and a Stratos-clock
  column (with a waterfall toggle) times requests from the console's own
  start instead of the browser's.
- The side-nav "Show all menu items" checkbox is now a debug tool, gated
  behind the theme's `debug.showAllMenuItemsToggle` company-config flag
  and hidden by default; stale browser state is ignored while the gate
  is off.

[BugFixes]
- The Monaco editor prefetch waits for the window load event, so warming
  the editor bundle no longer distorts the initial-load milestone on the
  performance page.
- 304 revalidations are counted as cache validations on the performance
  page instead of full transfers.

[Chores]
- New deploy guide for keeping SQLite state across Cloud Foundry
  restarts: continuous Litestream replication and user-provided-service
  snapshots, with the two hard preconditions both lanes share — a stable
  `ENCRYPTION_KEY` and `SQLITE_KEEP_DB=true` (without the latter,
  jetstream deletes the database file at startup and a Litestream
  replica is then overwritten with the emptied database).
