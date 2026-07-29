[Features]
- An endpoint whose token has expired is now a first-class state with one-click recovery, rather than presenting as a generic connection failure (#5636). Connect and disconnect show transient states, endpoint dialogs are modeless, and CF section navigation was fixed alongside them (#5642).

[BugFixes]
- Registering an endpoint surfaces the new GUID so the connect step can use it (#5355), first connect falls back to the last-used username (#5384), a native CF endpoint error is classified as unreachable or auth in the banner (#5385), and the reconnect action in the snackbar opens the connect dialog (#5631).
