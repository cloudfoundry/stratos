[Security Updates]
- Jetstream's HTTP framework, Echo, moved from 5.3.1 to 5.4.0 in every
  backend module. The release fixes seven advisories
  (GHSA-2ffq-g2xg-c22p, GHSA-99jh-6h7p-pp36, GHSA-h9g5-28mm-hx3g,
  GHSA-r7w9-592q-9vg4, GHSA-v753-g4cw-jm48, GHSA-375p-5qhx-8wq4,
  GHSA-3pmx-cf9f-34xr), among them static-file paths that could bypass
  a guarded route and forwarded-scheme headers any client could set.
  Its stricter handling does not change how Jetstream behaves: HSTS
  and the Cloud Foundry HTTPS redirect do not depend on Echo's scheme
  detection, and the UI's static files never use `//` or dot segments.

[Maintainability]
- Jetstream no longer depends on `govau/cf-common`, unmaintained since
  2020, through which it read every configuration setting. The small
  part it used now lives in the repository as `api/env`, with tests.
  This also removes the stale `go-cfenv` 1.19.0 that four backend
  modules inherited from it; `go-cfenv` is now 1.24.3 throughout.

[Chores]
- The backend moved to Go 1.27.1, and the CI tools image from Go
  1.26.5 to 1.27.1. Dependency updates: fw-capi 3.229.2, go-sqlite3
  0.35.6, Helm 3.22.0 with the Kubernetes client libraries 0.37.1,
  the AWS SDK for Go v2 1.47.1 and `code.cloudfoundry.org/clock`
  1.89.0.
