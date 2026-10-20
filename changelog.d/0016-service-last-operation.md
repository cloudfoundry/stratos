[BugFixes]
- Service instance lists now say which operation a Last Operation pill
  is about: "Create in progress", "Update failed", "Delete succeeded"
  instead of the bare state. A failed operation's hover text adds the
  broker's reason, with any markup removed. A queued operation shows
  as in progress.
- A service instance's page shows "Last operation: Update failed" and,
  only for a failure, the broker's reason as text on the page, so
  screen reader and keyboard users get it too.
- A failed create in the service instance wizard reports the broker's
  reason without its markup.
