# Stratos — Cloud Foundry Web Console

## Identity

Web-based management console for Cloud Foundry and Kubernetes. Angular 20
frontend, Go backend (Echo v4), plugin architecture.

## Plans

All plans MUST be stored in the **repository's** `plans/` directory.

**Naming**: Descriptive kebab-case (e.g., `stratos-developer-environment.md`).

**Authority**: The repo plan file is the single source of truth for any task.

## Development Rules

### Commit Rules

| Rule | Constraint |
|------|------------|
| Subject | Max 48 characters |
| Body | Max 72 characters wide |
| Scope | Single atomic concept |
| Format | Imperative mood |
| Style | Never mix with functional changes |

DO NOT use `<type>: <summary>` format in subjects.

### Branch Rules

All changes go to **feature branches** off `develop`. Never push directly
to `develop` or `master`.

### Code Style

- **Frontend**: Prefer Tailwind over SCSS for new code. Use semantic color
  classes (`text-content-text`, `text-content-muted`) not raw grays.
- **Backend**: Standard Go conventions. `go fmt` and `go vet` must pass.
- **Testing**: Vitest for frontend, Go `testing` for backend, Playwright for E2E.

### AI Tool Usage

Cloud Foundry RFC-0047 requires disclosure of AI tooling in contributions.
Disclose in PR description, commit messages, or co-author line.

## Build System

Makefile uses **verb + target** pattern: `make build frontend`, `make test backend`.

### Key Commands

```bash
make build                    # frontend + backend (native platform)
make build PLATFORM=linux/amd64  # cross-compile backend
make build all                # all platforms (OS/arch suffix on binary)
make test                     # all tests
make lint                     # ESLint + go fmt + go vet
make release cf               # package for CF (validates Linux binary)
make dump version             # show version info
make help                     # all targets
```

### Version Resolution

Source of truth: `package.json` `version` field. Override with `VERSION=` on
make command line. `version.mk` parses semver and generates frontend
`build-info.ts` + Go ldflags.

### CF Deploy Process

1. `make build PLATFORM=linux/amd64` — cross-compile for CF
2. `make release cf` — validates Linux ELF binary, packages zip
3. `cf target -o system -s stratos` — ALWAYS before push
4. `cf push -f dist/cf-package/manifest.yml -p dist/stratos-cf-*.zip`

IMPORTANT: `make release cf` uses `dist/bin/jetstream` (no OS/arch suffix).
Must be a Linux binary or packaging fails with clear error. Never use
`--no-route` on `cf push` — it drops route mappings.

## Architecture

### Frontend

- Angular 20, NgRx state, Tailwind CSS
- Packages: `core/`, `store/`, `cloud-foundry/`, `kubernetes/`, `shared/`
- Build: `@stratos/builders:prebuild-application` custom builder
- Path aliases: `@stratosui/core`, `@stratosui/store`, etc.

### Backend

- Go 1.24.2, Echo v4, plugin architecture
- Plugins: `cfapppush/`, `kubernetes/`, `monocular/`, `analysis/`, `userinvite/`
- Database: PostgreSQL (recommended), MySQL/MariaDB, SQLite
- Migrations: Goose (dialect-aware, auto-runs on startup)
- Config: 5-tier lookup: DB store > env vars > CF UPS > .env file > /etc/secrets

### Runtime Versions

Pinned in `.tool-versions` (use `mise install` or `asdf install`):

| Tool | Version |
|------|---------|
| Node.js | 24.11.0 |
| Bun | 1.3.2 |
| Go | 1.24.2 |

`build/check-versions.cjs` validates versions before tests (pretest hook).

## Key Files

| File | Purpose |
|------|---------|
| `Makefile` | Build orchestration (verb+target) |
| `version.mk` | Version resolution, ldflags, fe-version |
| `package.json` | Version source of truth |
| `.tool-versions` | Runtime version specs |
| `build/release-cf.sh` | CF packaging with Linux validation |
| `build/check-versions.cjs` | Runtime version validation |
| `proxy.conf.cjs` | Dev server proxy config |

## Documentation

| Doc | Audience |
|-----|----------|
| `docs/contributing_guide.md` | New contributors |
| `docs/developer-environment.md` | Experienced developers |
| `docs/pagination-architecture.md` | List/table internals |
| `plans/ui-enhancement-analysis.md` | 44-item UI priority list |
| `plans/stratos-developer-environment.md` | Dev environment plan |

## Jira

- **FWT**: FiveTwenty project for Stratos UI work
- **FWT-840**: Build system improvement ideas
- **FWT-811**: UI enhancement umbrella (44 items)
- **FWT-834**: Apps list regression (under investigation)

## Knowledge Store

Obsidian vault: `/Users/norm/Projects/Tools/obsidian-knowledge-store/stratos/`
