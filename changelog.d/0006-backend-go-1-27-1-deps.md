[Security Updates]
- Echo, Jetstream's HTTP framework, moved from 5.3.1 to 5.4.0 in every
  backend module. It fixes seven advisories:

| Advisory              | What it fixes                                                     |
|-----------------------|-------------------------------------------------------------------|
| [GHSA-2ffq-g2xg-c22p] | Any client could set the forwarded-scheme headers                 |
| [GHSA-99jh-6h7p-pp36] | The proxy middleware passed on a spoofed `X-Real-IP`              |
| [GHSA-h9g5-28mm-hx3g] | JSONP accepted any callback name                                  |
| [GHSA-r7w9-592q-9vg4] | Method override could turn a POST into a GET and skip CSRF checks |
| [GHSA-v753-g4cw-jm48] | Control characters in a redirect path could redirect off-site     |
| [GHSA-375p-5qhx-8wq4] | An encoded static-file path could bypass a guarded route          |
| [GHSA-3pmx-cf9f-34xr] | Static files were served for paths with `.` or `..` segments      |

[GHSA-2ffq-g2xg-c22p]: https://github.com/labstack/echo/security/advisories/GHSA-2ffq-g2xg-c22p
[GHSA-99jh-6h7p-pp36]: https://github.com/labstack/echo/security/advisories/GHSA-99jh-6h7p-pp36
[GHSA-h9g5-28mm-hx3g]: https://github.com/labstack/echo/security/advisories/GHSA-h9g5-28mm-hx3g
[GHSA-r7w9-592q-9vg4]: https://github.com/labstack/echo/security/advisories/GHSA-r7w9-592q-9vg4
[GHSA-v753-g4cw-jm48]: https://github.com/labstack/echo/security/advisories/GHSA-v753-g4cw-jm48
[GHSA-375p-5qhx-8wq4]: https://github.com/labstack/echo/security/advisories/GHSA-375p-5qhx-8wq4
[GHSA-3pmx-cf9f-34xr]: https://github.com/labstack/echo/security/advisories/GHSA-3pmx-cf9f-34xr

- The stricter handling does not change how Jetstream behaves: HSTS and
  the Cloud Foundry HTTPS redirect do not depend on Echo's scheme
  detection, and the UI's static files never use `//` or dot segments.

[Maintainability]
- Jetstream no longer depends on `govau/cf-common`, unmaintained since
  2020, through which it read every configuration setting. The small
  part it used now lives in the repository as `api/env`, with tests.
  This also removes the stale `go-cfenv` 1.19.0 that four backend
  modules inherited from it; `go-cfenv` is now 1.24.3 throughout.

[Chores]
- Backend toolchain and dependency updates:

| Component                     | From            | To      |
|-------------------------------|-----------------|---------|
| Go (backend modules)          | 1.27.0          | 1.27.1  |
| Go (CI tools image)           | 1.26.5          | 1.27.1  |
| capi (CF API client)          | fork of 3.229.1 | 3.229.2 |
| go-sqlite3                    | 0.35.4          | 0.35.6  |
| Helm                          | 3.21.4          | 3.22.0  |
| Kubernetes client libraries   | 0.37.0          | 0.37.1  |
| AWS SDK for Go v2             | 1.46.0          | 1.47.1  |
| `code.cloudfoundry.org/clock` | 1.87.0          | 1.89.0  |

- capi now comes from its upstream release instead of a fork. The fork
  carried the "create a role by username and origin" change ahead of
  its release; 3.229.2 includes it.
- Sixteen `replace` directives that no longer affected the build were
  removed from the backend modules.
