[Maintainability]
- Jetstream now runs on Echo v5. Echo v4 is in security-and-bugfix-only
  maintenance until the end of 2026, and v5 reworked enough of the API —
  a concrete request context, `log/slog` for logging, a rearranged error
  handler — that the move had to happen in one step across the backend
  and every plugin.
- Retired the unmaintained `SermoDigital/jose` dependency from the
  Kubernetes auth plugin. It was used only to read a single claim out of
  a token the platform had already issued, which the standard library
  does directly.

[BugFixes]
- API request logs keep the format they had under Echo v4, but now pass
  through Jetstream's own logger, so `LOG_LEVEL` applies to them. Setting
  a level above `info` suppresses them; they remain gated by
  `LOG_API_REQUESTS` as before.
