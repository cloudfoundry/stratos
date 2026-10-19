[Maintainability]
- The store's signal-to-observable helper (`observeSignal`) now lives
  exactly as long as its subscription, whatever injector it is given.
  With a component's injector it used to end with that view and leave
  any later subscriber waiting forever. No current caller outlives its
  view; this removes the trap for the next one.
- The Helm upgrade page ends its upgrade-target subscription when the
  page closes, so a late answer no longer sets up a page that is gone.
