[BugFixes]
- With DIAGNOSTICS_ENABLED set, SSO login opens the login server's page
  again. The console answered the browser's login request with an empty
  page instead of sending it on, and other replies with no body, such as
  redirects and 204s, lost their status the same way.
