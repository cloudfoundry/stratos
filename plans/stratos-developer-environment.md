# Stratos Developer Environment & Documentation

- **Jira**: https://fivetwenty.atlassian.net/browse/FWT-840
- **Status**: Planning

## Goals

1. Define the environment and tools a Stratos developer needs
2. Determine IDE stance — are we restricting, recommending, or staying neutral?
3. Identify all tools a Stratos developer needs (minimum + recommended)
4. Identify improvements for the Stratos build system
5. Document minimum vs recommended environment — strictly required vs nice-to-have
6. Identify platform-specific gotchas — macOS vs Linux differences
7. Define the dev workflow end-to-end — clone to running locally to deploying
8. Evaluate CI/CD alignment — does local build match CI? Version drift risks?
9. Assess onboarding friction — what trips up a new developer on day one?
10. Improve and extend developer documentation for Stratos
11. Publish knowledge base documents to Obsidian vault (Stratos + build tools)
12. Collect build system ideas in a single Jira ticket for future exploration
13. Write documents with the audience in mind — tailor tone, depth, and assumptions
    to who will actually read each document (new contributor vs maintainer vs operator)

---

## Current State Assessment

### Required Runtimes

| Tool | Version | Source of Truth | Purpose |
|------|---------|----------------|---------|
| Node.js | 24.11.0 | `.tool-versions`, `package.json` engines | Frontend build tooling |
| Bun | 1.3.2 | `.tool-versions`, `package.json` engines (>=1.2) | Package manager, script runner |
| Go | 1.24.2 | `go.mod` | Backend compilation |
| Git | any | - | Source control, metadata |
| Make | any | - | Build orchestration |

### Optional / Recommended

| Tool | Purpose | When Needed |
|------|---------|-------------|
| Docker | MySQL for local backend | Backend development with DB |
| `zip` | Release packaging | `make release cf` or `make release github` |
| `swag` | OpenAPI docs generation | Backend API docs |
| `gosec` | Go security scanning | `make security` |
| `trivy` | Filesystem vuln scanning | `make security` |
| `govulncheck` | Go vuln database check | `make security` |
| OpenSSL | Generate dev-ssl certs, ENCRYPTION_KEY | First-time setup |

### IDE Stance (Current)

No IDE restrictions. VS Code gets implicit support (.vscode in gitignore, Angular
Language Service in devDeps). Go tooling (gopls) and Angular Language Service work
in any editor that supports LSP. No editor-specific configs are required.

**Decision needed**: Do we want to recommend VS Code with specific extensions, stay
neutral, or document multiple setups?

### CI Version Drift

| Component | CI Uses | Should Be | File |
|-----------|---------|-----------|------|
| Node.js | 16 | 24 | `.github/workflows/frontend_tests.yml` |
| Go | 1.21.0 | 1.24.2 | `.github/workflows/backend_tests.yml` |
| Package manager | npm | bun | `.github/workflows/frontend_tests.yml` |

### Onboarding Friction Points

1. **ENCRYPTION_KEY** — backend won't start without it, no auto-generation for local dev
2. **dev-ssl certs** — must exist before `make dev` works, no generation script
3. **SQLite broken in cross-builds** — CGO_ENABLED=0 means go-sqlite3 can't compile
4. **Custom Angular builder** — devkit must build before `ng build` works (handled by
   `bun install` postinstall, but confusing if it fails)
5. **Contributing guide outdated** — references deprecated `make dev-frontend` instead
   of `make dev frontend`; Go version says 1.21+ but go.mod requires 1.24.2
6. **No `make setup` target** — no single command for first-time environment setup
   (generate certs, create config.properties, set ENCRYPTION_KEY)
7. **`proxy.conf.cjs`** — gitignored but needed for dev; no generation step documented

### Existing Documentation

| Doc | Status | Notes |
|-----|--------|-------|
| `docs/build-and-packaging.md` | Good | Covers make targets, version system |
| `docs/contributing_guide.md` | Outdated | Deprecated commands, wrong Go version |
| `docs/devops_guide.md` | Unknown | Needs review |
| `docs/release_guide.md` | Unknown | Needs review |
| `docs/secrets-management.md` | Recent | ENCRYPTION_KEY handling |

---

## Task Order

### Phase 1: Decisions (gates everything else)

Resolve open questions before writing. Documentation content depends on these answers.

- [x] 1. **IDE stance** — DECIDED: Stay neutral, document what works. Mention
      VS Code + Angular Language Service + gopls as best out-of-box, don't prescribe.
- [x] 2. **Runtime manager** — DECIDED: All three, they're complementary.
      A) `.tool-versions` documented as canonical version spec (happens naturally).
      B) Recommend mise (or asdf) so the file doubles as an installer.
      C) Refactor `check-versions.cjs` to parse `.tool-versions` instead of
         hardcoding — single source of truth, no duplication.
      Also add `golang 1.24.2` to `.tool-versions`.
- [x] 3. **Database & container runtime** — DECIDED: Database-agnostic, runtime-agnostic.
      Dev default: SQLite (after modernc.org/sqlite swap). Production: operator's choice
      (Postgres recommended, MySQL/MariaDB supported). Compose file renamed to
      compose.yml with Postgres service. Container runtime not prescribed (Docker,
      Podman, OrbStack, Colima all work). Test across runtimes and DB backends.
- [x] 4. **config.properties → .env** — DECIDED: Rename to `.env` format.
      Consolidate 5 deployment-specific files into `.env.example` (checked in)
      + `.env` (gitignored, local copy). Same KEY=VALUE format, no parser changes.
      Go config loader just reads a different filename. ~5-7h effort.
      Test locally and CF push. Document expectations for Docker/K8s/Podman
      and let community validate those paths.
- [x] 5. **Contributing guide scope** — DECIDED: Full overhaul. Current guide is
      misleading (deprecated commands, wrong versions, missing setup steps).
      Source material goes beyond Obsidian — use codebase exploration + this plan.
- [x] 6. **Agentic usage stance** — DECIDED: RFC-0047 (Accepted) is the governing
      policy. Requires disclosure of AI tooling in PR description, commit messages,
      or co-author line. Approvers/Reviewers exempt. Updated contributing_guide.md
      with exact policy language and reference to RFC-0047.

### Phase 2: Build system ideas Jira ticket

Low effort, no dependencies on decisions. Captures ideas while they're fresh so
nothing gets lost. Everything else can reference this ticket.

- [x] 6. Create Jira ticket collecting all build system improvement ideas — FWT-840

**Ticket items:**

Build orchestration:
  - `make setup` for first-time bootstrap (generate certs, create .env, set ENCRYPTION_KEY)
  - `make doctor` to validate environment (check runtimes, certs, config, DB connectivity)
  - `make check` pre-flight before build (verify runtimes, disk space)
  - `make dev` auto-generates dev-ssl certs if missing
  - `fe-version` handle missing git gracefully (CI containers)

Configuration:
  - Rename config.properties → .env (consolidate 5 files into .env.example + .env)
  - Update Go config loader filename
  - Update build/install-local.sh and build/release-cf.sh
  - Test local dev + CF push paths

Runtime versioning:
  - Add `golang 1.24.2` to .tool-versions
  - Refactor check-versions.cjs to parse .tool-versions (single source of truth)
  - Document mise/asdf as recommended version managers
  - CI workflow updates (Node 24, Go 1.24.2, bun instead of npm)

Database:
  - Replace go-sqlite3 with modernc.org/sqlite (fix CGO cross-compile)
  - Update/replace sqlitestore session store for modernc.org/sqlite
  - Add Postgres service to compose.yml
  - Rename docker-compose.yml → compose.yml (OCI spec)
  - Database connectivity + migration tests for all three backends in CI

Container runtime:
  - Test compose.yml against Docker, Podman, OrbStack
  - Document runtime-agnostic stance (don't prescribe)

### Phase 3: Obsidian knowledge base documents

Write the deep reference material first — this is the research that feeds the
public-facing repo docs. Easier to write complete reference docs and then distill
them for specific audiences than the other way around.

**Audience**: Project maintainers. Assumes deep context. Optimized for lookup
speed and completeness over explanation.

**Location**: `/Users/norm/Project.save/Tools/obsidian-knowledge-store/stratos/`

- [x] 7. `stratos/docs/architecture-overview.md` — Components, packages, plugins,
      database architecture, deployment modes
- [x] 8. `stratos/docs/build-system.md` — Verb+target pattern, version resolution,
      cross-compilation, release packaging, directory layout
- [x] 9. `stratos/docs/developer-environment.md` — Runtimes, versions, config,
      IDE support, testing, CI/CD, env vars reference
- [x] 10. `stratos/docs/dev-workflow.md` — First-time setup through deploy,
      daily dev, testing, troubleshooting

### Phase 4: Repo documentation (public-facing)

Distill knowledge base material for each audience. Decisions from Phase 1 shape
the recommendations here.

- [x] 11. Update `docs/contributing_guide.md` — Full overhaul. Fixed deprecated
      commands, corrected Go version, added first-time setup (certs, ENCRYPTION_KEY,
      config), fixed commit style (imperative, no type: prefix), changed base branch
      to develop, added AI usage policy, removed incorrect tech references.

      **Audience**: New contributors, possibly first time with Angular or Go.
      Assumes general dev experience but no Stratos knowledge. Hand-holding,
      explains "why" not just "what".

- [x] 12. Created `docs/developer-environment.md` — Canonical reference for
      runtimes, version management, container runtimes, database backends,
      configuration (5-tier lookup), ports, IDE support, platform notes, CI drift.

      **Audience**: Experienced developers joining the project. Knows their way
      around a terminal, needs "what" and "where" fast. Table-driven, minimal prose.

### Phase 5: Verification

- [x] 13. Walk through contributing guide as a new developer — all commands verified
      correct against Makefile targets, package.json scripts, config files, ports,
      branch names, and build tooling. Zero discrepancies found.
- [x] 14. Verify CI drift is documented — expanded drift table in developer-environment.md
      to cover all 7 workflow files. Found additional drift: documentation workflows
      still on Node 12, pr/release workflows have Go 1.21 (should be 1.24.2).
      Fix tracked in FWT-840.
- [x] 15. Review all docs for audience alignment — contributing guide targets new
      contributors (step-by-step, explains why), developer-environment.md targets
      experienced devs (table-driven, fast lookup). Cross-references in place.

---

## Research: Database Strategy (Decision 3)

### Current State
- **PostgreSQL**: Production-ready in code, recommended in devops_guide.md, but
  missing from docker-compose.yml and underdocumented for dev setup
- **MySQL**: Works, driver is MPL-2.0 (no GPL issue in Stratos code). Server is
  GPL — licensing concern is in deployment choices, not code
- **SQLite**: Dev-only. go-sqlite3 (v1.14.28) requires CGO_ENABLED=1, which breaks
  cross-compilation (Makefile uses CGO_ENABLED=0)

### SQLite CGO Problem (Detail)
- `github.com/mattn/go-sqlite3` wraps C SQLite via cgo
- Cross-compilation (e.g., macOS building linux/amd64) needs a cross-compiler toolchain
- Build script sets `CGO_ENABLED=0` for portability — this disables go-sqlite3 entirely
- **Fix**: Replace with `modernc.org/sqlite` — pure Go, no CGO, same SQL compat
- **Effort**: ~1 week (update imports, test session store, verify migrations)

### Database Agnosticism Level: ~70%
- Queries written as PostgreSQL, auto-converted at runtime via `ModifySQLStatement()`
- Converts `$1, $2` placeholders to `?` for MySQL/SQLite
- Converts `id::varchar` to `CAST(id AS varchar)`
- Migrations handle dialect differences (BYTEA vs BLOB)
- Session stores are the limiting factor: 3 separate packages (pgstore, mysqlstore, sqlitestore)

### Recommended Direction
- Default to PostgreSQL for compose and documentation
- Keep MySQL/MariaDB support (no removal needed, just not the default)
- Replace go-sqlite3 with modernc.org/sqlite for dev convenience
- Add Postgres to compose.yml (~2-3 days)
- Future: configuration wizard for database selection during setup

### Container Runtime Stance
Stratos is runtime-agnostic. The compose file works with any OCI-compatible runtime:
- Docker Desktop, Podman, OrbStack, Colima — all supported
- Rename `docker-compose.yml` to `compose.yml` (spec-compliant name)
- Document by task ("run a local Postgres") not by runtime
- Don't prescribe — same philosophy as databases and IDEs

### Production Database Services
Production databases are always external managed services, never bundled:
- Cloud Foundry: bound marketplace service (auto-detected via VCAP_SERVICES)
- Kubernetes: cloud provider DB (RDS, Cloud SQL, etc.) via env vars or /etc/secrets
- Docker/Podman Compose: sidecar container or external service via env vars
- Bare metal/VM: DBA-managed instance via config.properties or env vars

Any Postgres-compatible (CockroachDB, Aurora, AlloyDB) or MySQL-compatible
(MariaDB, Aurora MySQL, PlanetScale) service works with existing drivers.

### Testing Requirements
- Compose file tested against Docker, Podman, and OrbStack
- Database connectivity tests for Postgres, MySQL/MariaDB, and SQLite
- Migration tests run against all three database backends in CI
- Session store tests for each backend

---

## Research: Configuration Format (Decision 4)

### Architecture
Stratos uses a 5-tier lookup chain (first match wins):
1. Database config store (runtime, after initial setup)
2. System environment variables (os.Getenv)
3. CF User-Provided Service (CF deployments only)
4. config.properties file (KEY=VALUE, custom parser)
5. /etc/secrets directory (one file per key, K8s pattern)

### Key Finding
**All config values work from both file and environment.** The config.properties
format is just one source in the chain. Environment variables always take precedence
over the file.

### Config Files in Repo (5 deployment-specific)
- `src/jetstream/config.properties` — dev defaults (79 lines)
- `src/jetstream/config.example` — template with examples (94 lines)
- `deploy/cloud-foundry/config.properties` — CF template (27 lines)
- `deploy/ci/travis/config.properties` — CI config (27 lines)
- `electron/config.properties` — Electron desktop (72 lines)

### Migration Options
| Option | Effort | Impact |
|--------|--------|--------|
| A: Keep file, also support .env | 8-12h | Non-breaking, adds flexibility |
| B: Env-only (12-factor) | 8-12h | Breaking for file users, simplest result |
| C: YAML/JSON format | 25-40h | New parser, migration tool needed |
| D: Adopt viper library | 22-35h | Supports all formats, mature ecosystem |

### Decision
Rename config.properties → .env. Consolidate 5 files into one `.env.example`.
Same KEY=VALUE format, no parser changes needed. ~5-7h effort.
Test: local dev + CF push. Document expectations for Docker/K8s/Podman
for community validation.

---

## Research: Agentic Usage Policy (Decision 6)

### Stance
- AI tools (Claude, Copilot, etc.) **can be used** but usage must be **acknowledged**
- CloudFoundry org projects must follow CFF policy on agentic usage
- CloudFoundryCommunity is not governed by CFF — can have a different policy but
  should aim to align
- Document in contributing guide: what acknowledgment looks like (commit messages,
  PR descriptions, or both)

### Open Questions
- What is the current CFF stance? Need to check CFF governance docs
- What does "acknowledge" mean in practice? (tag in commit? note in PR? section in changelog?)
- Does this apply to code generation only, or also to documentation, tests, plans?

