[Maintainability]
- Jetstream now runs on Echo v5. Echo v4 is in security-and-bugfix-only
  maintenance until the end of 2026, and v5 reworked enough of the API —
  a concrete request context, `log/slog` for logging, a rearranged error
  handler — that the move had to happen in one step across the backend
  and every plugin.
- Retired four unmaintained or superseded dependencies:
  `SermoDigital/jose` (no upstream release since 2019) is gone from the
  Kubernetes auth plugin, which used it only to read one claim from a
  token the platform had already issued; `satori/go.uuid` (abandoned) is
  replaced by `google/uuid`, which the backend already depended on for
  the same purpose; `golang/mock` (archived) moves to its successor
  `go.uber.org/mock`; and `gorilla/context`, obsolete since Go 1.7, is
  gone along with the middleware that existed only to call it.

[BugFixes]
- Jetstream logs through one logger again. Echo v5 logs via `log/slog`
  and defaults to writing JSON to standard output, which meant its
  messages interleaved with Jetstream's own text-formatted logs on the
  same stream and ignored `LOG_LEVEL`. Echo's output is now routed into
  the application logger, so format and level apply to everything.
  API request logs keep the format they had under Echo v4 and remain
  gated by `LOG_API_REQUESTS`; they now also respect `LOG_LEVEL`.

[Chores]
- Jetstream now builds with Go 1.27. Go 1.27 rejects the invalid hash id
  that `SermoDigital/jose` registers from an init function, which panics
  before `main` and crash-loops the binary. The dependency is reached
  through the CF CLI rather than our own code, so it is pinned to a fork
  with that registration removed until the CF CLI moves to a maintained
  JWT library.
