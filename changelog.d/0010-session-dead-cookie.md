[BugFixes]
- Signing in to a console deployed on Cloud Foundry works again for a
  browser that still holds the cookie of an ended session (signed out in
  another tab, cleaned up after expiry, or dropped by the 5.5.5 sessions
  table migration). Since 5.5.5 the sign-in answered 200 but saved nothing,
  so the next request was refused and the user was sent back to the login
  page until they cleared the console's cookies. A cookie with no session
  behind it now starts a new session, as the per-database stores did
  before 5.5.5.
