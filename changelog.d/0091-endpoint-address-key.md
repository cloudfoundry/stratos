[BugFixes]
- With user endpoints on, a user's own endpoint now hides the system
  endpoint at the same address even when the two were registered with a
  different host case or an explicit default port, as connect and login
  already treated them.
- Disconnecting the auto-registered Cloud Foundry now stays disconnected
  at the next login when its registered address differs from
  `AUTO_REG_CF_URL` only in host case, default port or a trailing slash.
