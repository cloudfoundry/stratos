# Developer Environment Reference

Canonical reference for required and optional tools, platform notes, and
configuration. For step-by-step setup, see the
[Contributor Guide](contributing_guide.md).

## Required Runtimes

| Tool | Version | Pinned In | Purpose |
|------|---------|-----------|---------|
| Node.js | 24.11.0 | `.tool-versions`, `package.json` engines | Angular CLI, build tooling |
| Bun | 1.3.2 | `.tool-versions`, `package.json` engines (>=1.2) | Package manager, script runner |
| Go | 1.24.2 | `go.mod` | Backend compilation |
| Git | any | — | Source control, build metadata |
| Make | any | — | Build orchestration |

### Version Management

`.tool-versions` is the single source of truth for runtime versions.

| Manager | Install | Usage |
|---------|---------|-------|
| [mise](https://mise.jdx.dev/) (recommended) | `brew install mise` | `mise install` |
| [asdf](https://asdf-vm.com/) | `brew install asdf` | `asdf install` |
| Manual | Per-tool installers | Match versions in `.tool-versions` |

`build/check-versions.cjs` validates versions before tests run (pretest hook).

## Optional Tools

| Tool | Purpose | Install | When Needed |
|------|---------|---------|-------------|
| Docker / Podman / OrbStack / Colima | Run database containers | Per-tool | Backend dev with PostgreSQL |
| OpenSSL | Generate dev certs and encryption keys | Included on macOS/Linux | First-time setup |
| `zip` | Release packaging | `brew install zip` | `make release` |
| `swag` | OpenAPI doc generation | `go install github.com/swaggo/swag/cmd/swag@latest` | API docs |
| `golangci-lint` | Go meta-linter (staticcheck, errcheck, unused, ineffassign) | [golangci-lint.run](https://golangci-lint.run/welcome/install/) | `make lint`, `make check` — lint hard-fails without it |
| `gosec` | Go security scanner | `go install github.com/securego/gosec/v2/cmd/gosec@latest` | `make audit backend`, `make audit tests` |
| `trivy` | Vulnerability + misconfig scanner | [aquasecurity/trivy](https://github.com/aquasecurity/trivy) | `make audit backend`, `make audit tree` |
| `govulncheck` | Go vuln database | `go install golang.org/x/vuln/cmd/govulncheck@latest` | `make audit backend`, `make audit summary` |
| `zizmor` | GitHub Actions workflow SAST | `brew install zizmor` | `make audit actions` |
| `osv-scanner` | Multi-lockfile dependency scanner | `brew install osv-scanner` | `make audit packages`, `make audit licenses` |
| `gitleaks` | Secret scanner | `brew install gitleaks` | `make audit secrets`, `make audit history` |
| `modrot` | Archived/deprecated dependency scanner | `go install github.com/norman-abramovitz/modrot@latest` | `make audit modrot` (needs `gh auth`) |
| `semgrep` | Pattern-based SAST | `brew install semgrep` | `make audit semgrep` (manual, needs network) |
| `codeql` | Deep SAST (Go + JS/TS databases) | [codeql-action releases](https://github.com/github/codeql-action/releases) | `make audit codeql` (manual — CI already runs this canonically; local run is a pre-push spot-check) |
| `sarif-tools` (`sarif`) | Summarize SARIF files | `pip install sarif-tools` | `make audit sarif` |
| `gh` | GitHub CLI | [cli.github.com](https://cli.github.com/) | `make deps dependabot`, `make audit upload`, `make audit actions` (optional, for authenticated rate limits) |

### Audit & dependency commands

| Command | Purpose |
|---------|---------|
| `make audit` | Default scanner set: frontend + website + backend + actions + packages + secrets |
| `make audit frontend` | `bun audit` (npm advisory DB), root workspace |
| `make audit website` | `bun audit` (npm advisory DB), `website/` workspace (`tools/stb` isn't covered — pre-release) |
| `make audit backend` | gosec + trivy + govulncheck on both Go modules (`src/jetstream`, `src/jetstream/api`) |
| `make audit actions` | zizmor SAST over `.github/workflows/`; `ZIZMOR_FLAGS="--persona=auditor"` enables the strict rule set |
| `make audit packages` | osv-scanner over every lockfile and `go.mod` in one pass |
| `make audit secrets` | gitleaks scan of the working tree |
| `make audit summary` | High/moderate/low totals only — fast triage |
| `make audit tests` | gosec including `_test.go` files, plus a `#nosec` suppression report |
| `make audit tree` | trivy over the whole repo — covers the Dockerfiles, helm chart, and manifests under `deploy/` |
| `make audit history` | gitleaks over the full git history (~14k commits) |
| `make audit licenses` | osv-scanner dependency license report |
| `make audit modrot` | modrot archived/deprecated dependency scan (needs `gh auth`) |
| `make audit semgrep` | semgrep SAST via `semgrep ci` — uses your logged-in account's policy and dashboard if you've run `semgrep login`, falls back to community rules otherwise. SARIF to `dist/semgrep.sarif` |
| `make audit codeql` | Local CodeQL SAST (Go + JS/TS) — manual pre-push mirror of what `.github/workflows/codeql.yml` runs on every push/PR. SARIF to `dist/codeql-{go,js}.sarif` |
| `make audit sarif` | `sarif-tools` summary across every `dist/*.sarif` file, local only |
| `make audit upload` | Push `dist/*.sarif` to GitHub code scanning; skips `codeql-*.sarif` since CI already uploads those canonically. Needs push access to the repo |
| `make outdated` | List outdated direct deps in both stacks |
| `make outdated frontend` | `bun outdated` |
| `make outdated backend` | `go list -m -u all` (filtered to upgradable) |
| `make deps dependabot` | List open dependency PRs (requires `gh` auth) |

#### Non-default audit modes

`make audit` runs the six default scanners only (frontend, website, backend,
actions, packages, secrets). The rest are deliberately kept off the default
path:

- **`tests`** — gosec findings inside `_test.go` files are advisory (test code
  doesn't ship), so they would add triage noise to every default run. Run it
  when auditing test hygiene or reviewing `#nosec` suppressions.
- **`tree`** — scans the entire repository instead of `src/jetstream`. It
  exists for the deployment surface (`deploy/` Dockerfiles, helm chart, CF
  manifests) which the backend scan doesn't reach. It is slower than the
  default set and its misconfig findings change rarely — run it when touching
  anything under `deploy/` or before a release.
- **`history`** — walks all ~14k commits (roughly 15 seconds, vs instant for
  the working-tree scan). Historical findings are almost entirely pre-2020
  test fixtures; this is a forensic tool, not an everyday guard. The default
  `secrets` mode already catches anything you are about to commit.
- **`licenses`** — a compliance report, not a vulnerability source. Nothing
  in it is actionable on a normal development day.
- **`modrot`** — needs `gh auth` (GitHub GraphQL) + network, so it's a
  standalone extra rather than something every `make audit` run should
  depend on.
- **`semgrep`**, **`codeql`** — both need extra tooling (a `semgrep` account
  login, the `codeql` CLI + query packs) and are meant to run manually on the
  build machine, not on every audit invocation. CodeQL in particular already
  runs in CI on every push/PR — the local mode exists so you can see findings
  before pushing, not to replace CI.
- **`sarif`**, **`upload`** — these consume the other scanners' `dist/*.sarif`
  output; they're only meaningful after running one of the SARIF-emitting
  modes, so they don't belong in a default sweep either.

All audit recipes are report-only (`|| true`): they never fail the build, so
scanner exit codes are informational. The lint/test gates are where failures
block.

## Container Runtimes

Stratos does not prescribe a container runtime. Any OCI-compatible runtime
works with the project's `compose.yml`:

| Runtime | Platform | Notes |
|---------|----------|-------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | macOS, Linux, Windows | Most common, licensing applies to large orgs |
| [Podman](https://podman.io/) | macOS, Linux, Windows | Rootless, daemonless, no licensing cost |
| [OrbStack](https://orbstack.dev/) | macOS | Lightweight, fast, Docker-compatible |
| [Colima](https://github.com/abiosoft/colima) | macOS, Linux | Minimal Docker-compatible on Lima VMs |

## Database Backends

Stratos connects to external SQL databases. It does not bundle a database server.

| Backend | `DATABASE_PROVIDER` | Local Dev | Production |
|---------|-------------------|-----------|------------|
| SQLite | `sqlite` | Default, zero setup | Not recommended |
| PostgreSQL | `pgsql` | Via container | Recommended |
| MySQL / MariaDB | `mysql` | Via container | Supported |

Any PostgreSQL-compatible (CockroachDB, Aurora, AlloyDB) or MySQL-compatible
(MariaDB, Aurora MySQL, PlanetScale) service works with existing drivers.

### Database Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_PROVIDER` | Backend selection | `sqlite` |
| `DB_HOST` | Hostname | `localhost` |
| `DB_PORT` | Port | 5432 (pgsql), 3306 (mysql) |
| `DB_USER` | Username | — |
| `DB_PASSWORD` | Password | — |
| `DB_DATABASE_NAME` | Database name | `stratos` |
| `DB_SSL_MODE` | TLS mode | `disable` |

## Configuration

Backend reads configuration from a 5-tier lookup chain (first match wins):

1. **Database config store** — runtime settings saved after initial setup
2. **Environment variables** — `export KEY=value` or in container env
3. **CF User-Provided Service** — Cloud Foundry deployments only
4. **`.env` file** — KEY=VALUE format in working directory
5. **`/etc/secrets` directory** — one file per key (Kubernetes pattern)

All configuration keys work from any tier. Environment variables always
override file-based settings.

### Key Settings

| Variable | Purpose | Required |
|----------|---------|----------|
| `ENCRYPTION_KEY` | 256-bit hex encryption key | Yes |
| `CONSOLE_PROXY_TLS_ADDRESS` | Listen address | No (default `:5443`) |
| `AUTH_ENDPOINT_TYPE` | `local` or `remote` | No (default `remote`) |
| `SESSION_STORE_SECRET` | Cookie encryption | No (has default) |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` | No |
| `SKIP_SSL_VALIDATION` | Skip TLS checks for CF endpoints | No |

See `src/jetstream/config.example` for all available settings with descriptions.

## Ports

| Service | Default | Override Variable |
|---------|---------|-------------------|
| Frontend dev server | 5440 | `FRONTEND_PORT` |
| Backend (jetstream) | 5443 | `BACKEND_PORT` |
| E2E frontend | 5540 | Playwright config |
| E2E backend | 5543 | Playwright config |

## IDE Support

No IDE is prescribed. Stratos works with any editor that supports LSP.

| Editor | Recommended Extensions |
|--------|-----------------------|
| VS Code | Angular Language Service, Go (gopls) |
| WebStorm / GoLand | Built-in Angular + Go support |
| Neovim | angular-language-server + gopls via LSP |

Angular Language Service is included in devDependencies for template
type-checking in any IDE.

## Supported Platforms

### Developer build platforms

| OS | Arch | Notes |
|----|------|-------|
| macOS | arm64 (Apple Silicon) | Primary dev platform |
| macOS | amd64 (Intel) | Supported |
| Linux | amd64 | CI and dev |
| Linux | arm64 | Supported |

### Target platforms (cross-compilation)

| OS | Arch | Use case |
|----|------|----------|
| linux | amd64 | Cloud Foundry, Docker, most servers |
| linux | arm64 | ARM servers, Graviton |
| darwin | amd64 | macOS Intel |
| darwin | arm64 | macOS Apple Silicon |
| windows | amd64 | Windows servers |
| windows | arm64 | Windows ARM |

Platform detection uses `uname -s | tr '[:upper:]' '[:lower:]'` for OS and
normalizes architecture (`x86_64` → `amd64`, `aarch64` → `arm64`) to match
Go's `GOOS`/`GOARCH` conventions. Override with `PLATFORM=os/arch`.

### Platform-specific notes

#### macOS

- Xcode Command Line Tools required (`xcode-select --install`) for Make and Git
- GNU Make 3.81+ required (ships with Xcode CLI tools)
- `openssl` from Homebrew recommended over LibreSSL for cert generation
- Apple Silicon (arm64) is the native build target; use `PLATFORM=linux/amd64`
  for CF release builds

#### Linux

- `build-essential` package provides Make and GCC
- SQLite no longer needs GCC/cgo — the backend uses the pure-Go
  `ncruces/go-sqlite3` driver, so standard `CGO_ENABLED=0` builds work

## CI/CD

GitHub Actions workflows:

| Workflow | File | Trigger |
|----------|------|---------|
| Frontend tests | `.github/workflows/frontend_tests.yml` | Push/PR to develop/main |
| Backend tests | `.github/workflows/backend_tests.yml` | Push/PR to develop/main |
| Docker builds | `.github/workflows/docker.yml` | Release + manual dispatch |

### Known CI Drift

CI workflows use outdated tool versions. Tracked in
[FWT-840](https://fivetwenty.atlassian.net/browse/FWT-840).

| Workflow | Component | CI Version | Should Be |
|----------|-----------|------------|-----------|
| frontend_tests | Node.js | 16 | 24 |
| backend_tests | Go | 1.21.0 | 1.24.2 |
| pr | Node.js | 24 | 24 (correct) |
| pr | Go | 1.21 | 1.24.2 |
| release | Node.js | 24 | 24 (correct) |
| release | Go | 1.21 | 1.24.2 |
| All | Package manager | npm | bun |

## CF Release Build Process

`make release cf` packages the app for CF deployment but does **not** build.
The backend binary must be pre-built for the target Linux platform.

### Build naming

| Command | Output | Purpose |
|---------|--------|---------|
| `make build` | `dist/bin/jetstream-{os}-{arch}` (all platforms) | Frontend + all backend platforms |
| `make build backend PLATFORM=linux/amd64` | `dist/bin/jetstream` | Single backend platform |
| `make dev backend` | `dist/bin/jetstream` | Host platform only (development) |

### CF release workflow

```bash
# 1. Build and package in one command (cf modifier forces linux/amd64):
make build release cf

# Or step by step:
make build cf
make release cf

# 3. Deploy
cf target -o system -s stratos
cf push -f dist/cf-package/manifest.yml -p dist/stratos-cf-<version>.zip
```

`make release cf` validates that `dist/bin/jetstream` is a Linux ELF binary
before packaging. If it's a macOS or Windows binary, the packaging fails with
a clear error.

### On CI (Linux)

`make build cf` produces a Linux binary natively. Or `make build release cf` to
build and package in one step.

### On macOS

The `cf` modifier automatically sets `PLATFORM=linux/amd64`:

```bash
make build release cf                          # linux/amd64 (default)
make build release cf PLATFORM=linux/arm64     # ARM CF deployments
```

## Further Reading

- [Contributing Guide](contributing_guide.md) — step-by-step workflow
- [Build and Packaging](build-and-packaging.md) — Make targets, release process
- [Secrets Management](secrets-management.md) — encryption key handling
