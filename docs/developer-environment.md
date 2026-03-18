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
| `gosec` | Go security scanner | `go install github.com/securego/gosec/v2/cmd/gosec@latest` | `make security` |
| `trivy` | Vulnerability scanner | [aquasecurity/trivy](https://github.com/aquasecurity/trivy) | `make security` |
| `govulncheck` | Go vuln database | `go install golang.org/x/vuln/cmd/govulncheck@latest` | `make security` |

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

## Platform Notes

### macOS

- Xcode Command Line Tools required (`xcode-select --install`) for Make and Git
- `openssl` from Homebrew recommended over LibreSSL for cert generation
- Apple Silicon (arm64) is the native build target; use `PLATFORM=linux/amd64`
  for CF release builds

### Linux

- `build-essential` package provides Make and GCC
- If using SQLite locally, GCC is required for cgo (until modernc.org/sqlite
  migration, tracked in FWT-840)

## CI/CD

GitHub Actions workflows:

| Workflow | File | Trigger |
|----------|------|---------|
| Frontend tests | `.github/workflows/frontend_tests.yml` | Push/PR to develop/master |
| Backend tests | `.github/workflows/backend_tests.yml` | Push/PR to develop/master |
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
| documentation | Node.js | 12 | 24 |
| documentation-versioning | Node.js | 12 | 24 |
| All | Package manager | npm | bun |

## CF Release Build Process

`make release cf` packages the app for CF deployment but does **not** build.
The backend binary must be pre-built for the target Linux platform.

### Build naming

| Command | Output | Purpose |
|---------|--------|---------|
| `make build` | `dist/bin/jetstream` | Single binary for current or specified platform |
| `make build all` | `dist/bin/jetstream-linux-amd64`, `jetstream-darwin-arm64`, etc. | All platforms with OS/arch suffix |

### CF release workflow

```bash
# 1. Build frontend + Linux backend (specify platform — CF runs Linux)
make build PLATFORM=linux/amd64

# 2. Package for CF
make release cf

# 3. Deploy
cf target -o system -s stratos
cf push -f dist/cf-package/manifest.yml -p dist/stratos-cf-<version>.zip
```

`make release cf` validates that `dist/bin/jetstream` is a Linux ELF binary
before packaging. If it's a macOS or Windows binary, the packaging fails with
a clear error.

### On CI (Linux)

`make build` produces a Linux binary natively — no `PLATFORM` flag needed.

### On macOS

Must specify the target platform explicitly:

```bash
make build PLATFORM=linux/amd64    # or linux/arm64 for ARM CF deployments
make release cf
```

## Further Reading

- [Contributing Guide](contributing_guide.md) — step-by-step workflow
- [Build and Packaging](build-and-packaging.md) — Make targets, release process
- [Secrets Management](secrets-management.md) — encryption key handling
