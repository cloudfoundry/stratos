[Chores]
- Dependency bumps: the Angular family 22.1.4 to 22.1.5 with cli and devkit
  22.1.7, angular-eslint 22.1 to 22.5, `@playwright/test` 1.63, eslint 10.10,
  typescript-eslint 8.70, vitest 4.1.11, happy-dom 20.14, sass 1.104, marked
  18.0.12, acorn 8.18 and the other patch-level frontend packages; the
  Go modules take their current direct dependencies (go-cfenv 1.24, noaa 2.6,
  mysql 1.10, prometheus client 1.24, x/crypto 0.57, cf cli v8.19, k8s.io
  0.37, aws-sdk-go-v2 1.46, aws-iam-authenticator 0.7.20).
- Dropped `immer`, `reselect`, `globby` and `mem`, which nothing had imported
  for years.
- The devkit forces `qs` 6.16.0 through its overrides block, clearing the open
  Dependabot alert that express 4's `~6.15` pin kept it from fixing itself.
- The asdf Go pin in `.tool-versions` now matches go.mod and CI at 1.27.
