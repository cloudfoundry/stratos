[BugFixes]
- The endpoint connect dialog overwrote an auth form's default configuration
  with `undefined` whenever the auth type supplied none, and those templates
  read fields such as the help text without guarding. Every auth type shipped
  today supplies a configuration, so nothing was broken in practice — but the
  field is optional, the form component declares a default for exactly that
  case, and only coincidence stood between them.
