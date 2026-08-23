[BugFixes]
- Signing in no longer flashes the Home page, blanks the console, and
  reloads it. The login click handler and the existing-session check both
  triggered the post-login redirect; the two navigations cancelled each
  other and the loser fell back to a full page reload. The redirect now
  runs once.
