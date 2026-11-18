[BugFixes]
- Signing in now always starts a new session. On a console deployed to
  Cloud Foundry a sign-in kept the session the browser arrived with, so
  any copy of that earlier session cookie was signed in too.
