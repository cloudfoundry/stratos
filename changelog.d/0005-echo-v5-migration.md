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
- Dropped the archived AWS SDK v1. It was reachable only through
  aws-iam-authenticator, which has since moved to SDK v2; the Kubernetes
  IAM auth path moves with it.
- Upgraded Helm to v3.21.4 and the Kubernetes client libraries to v0.36.
  Kubernetes minor releases remove APIs, so these move as a set. This
  also repairs dependency maintenance in the Kubernetes plugin, where
  `go mod tidy` could not run at all: the previous Helm pulled a kubectl
  that imports an API removed in k8s v0.36.

[BugFixes]
- Jetstream serves its own HTTPS again where it terminates TLS itself.
  Echo v5 resolves a certificate path through a filesystem rooted at the
  working directory, which rejects an absolute path outright, and the
  certificate was still being passed as a path — so no HTTPS listener
  started at all. The Kubernetes chart, and the dev and CI configurations,
  all use path shapes that hit this. Deployments on Cloud Foundry were
  unaffected, since the router terminates TLS there.
- Helm chart files and chart icons no longer 404 on Kubernetes. File
  serving now goes through the same rooted filesystem, which accepts an
  absolute path only beneath the working directory; the chart sets a cache
  folder outside it, so every chart file and icon answered 404 for a file
  plainly present on disk. Analysis reports and an absolute `UI_PATH` had
  the same exposure whenever the process was not started from an ancestor
  directory.
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
