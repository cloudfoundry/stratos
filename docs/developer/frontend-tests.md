---
title: Frontend Tests
sidebar_label: Tests
---

## Test

Run every command from the repository root. Stratos tooling runs through
[Bun](https://bun.sh); the `make` targets are the supported entry points.
[TESTING.md](https://github.com/cloudfoundry/stratos/blob/develop/TESTING.md)
has the full testing guide.

### Lint

Run `make check lint` to run the frontend and backend linters: ESLint over the
frontend packages and `e2e/`, then `gofmt`, `go vet` and `golangci-lint` over
each Go module.

### Unit tests

Run `make test frontend` to execute the unit tests via [Vitest](https://vitest.dev).

To narrow a run, name the Vitest project and, optionally, a path:

- `make test frontend PROJECT=core`: test the core package
- `make test frontend PROJECT="core git"`: test several packages
- `make test frontend PROJECT=core SCOPE=src/frontend/packages/core/src/shared/components/stepper`: test one directory

The projects are `core`, `store`, `cloud-foundry`, `kubernetes`,
`cf-autoscaler`, `git`, `shared` and `extension`.

Other unit-test commands:

- `make check coverage`: run the unit tests with coverage; the report is written to `./coverage`
- `bun run test:watch`: run Vitest in watch mode
- `bun run test:ui`: run Vitest with its browser UI

Before opening a pull request, run `make check gate` (lint plus unit tests).

### End-to-end tests

Run `make test e2e` to execute the end-to-end tests via
[Playwright](https://playwright.dev/). It runs Chromium by default and starts a
local backend unless `E2E_BASE_URL` points at a deployed Stratos.

Useful options:

- `make test e2e DRYRUN=yes`: list the tests that would run, without running them
- `make test e2e E2E_BROWSERS=chromium,firefox`: choose browsers (`all` runs every configured browser)
- `make test e2e E2E_BASE_URL=https://<your-stratos>`: run against a deployed Stratos
- `make check e2e`: run only the core suites
- `make e2e clean`: remove the CF resources that test runs left behind

For interactive work, call Playwright through the package scripts:

- `bun run e2e:ui`: run tests with Playwright UI mode
- `bun run e2e:debug`: run tests in debug mode
- `bun run e2e:headed`: run tests in headed mode (see the browser)
- `bun run e2e:report`: view the last test report

More information on the E2E tests and the prerequisites for running them is
available here - [E2E Tests](developers-guide-e2e-tests.md).

### Continuous integration

Each pull request, and each push to it, runs these GitHub Actions checks:

- Lint check (`make check lint`)
- Frontend unit tests, one job per Vitest project
- Backend unit tests (`make test backend`)
- Build check (`make build frontend`, `make build backend`)
- CodeQL analysis for Go and JavaScript/TypeScript
- Docs lint, website build and booklets build
- Advisory checks: E2E impact (which E2E specs cover the change) and the changelog fragment

End-to-end tests are not part of the pull request checks.
