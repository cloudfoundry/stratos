# Stratos Contributor Guide

Welcome to Stratos. This guide walks you through setting up a development
environment and making your first contribution.

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 24+ | [nodejs.org](https://nodejs.org/) or `mise install` |
| Bun | 1.2+ | [bun.sh](https://bun.sh/) or `mise install` |
| Go | 1.24.2+ | [golang.org/dl](https://golang.org/dl/) or `mise install` |
| Git | any | [git-scm.com](https://git-scm.com/) |
| Make | any | Included with Xcode CLI tools (macOS) or `build-essential` (Linux) |

**Recommended**: Install [mise](https://mise.jdx.dev/) to manage runtime versions
automatically. The repo includes a `.tool-versions` file that specifies exact
versions. After installing mise:

```bash
mise install       # installs Node, Bun, and Go at the right versions
```

### First-Time Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/stratos.git
cd stratos

# 2. Install dependencies
make install

# 3. Generate dev SSL certificates
mkdir -p dev-ssl
openssl req -x509 -newkey rsa:4096 -keyout dev-ssl/server.key \
  -out dev-ssl/server.crt -days 365 -nodes \
  -subj '/CN=localhost'

# 4. Create backend configuration
cp src/jetstream/config.example src/jetstream/config.properties

# 5. Set the encryption key (required for backend to start)
# Generate a key and add it to config.properties:
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> src/jetstream/config.properties

# 6. For local development without a UAA server, enable local auth:
# Add these lines to config.properties:
#   AUTH_ENDPOINT_TYPE=local
#   LOCAL_USER=admin
#   LOCAL_USER_PASSWORD=admin
#   LOCAL_USER_SCOPE=stratos.admin

# 7. Build everything
make build

# 8. Start development (two terminals)
make dev backend      # Terminal 1: backend on port 5443
make dev frontend     # Terminal 2: frontend on port 5440
```

Open https://127.0.0.1:5440 (accept the self-signed certificate warning).

### Common Commands

```bash
make help              # show all available commands
make dev frontend      # start frontend dev server (hot reload)
make dev backend       # start backend API server
make test              # run all tests
make test frontend     # frontend tests only (Vitest)
make test backend      # backend tests only (Go)
make lint              # check code style
make audit             # security scan (frontend + backend)
make audit summary     # high/moderate/low totals only
make outdated          # list outdated direct deps
make deps dependabot   # show open dependency PRs (gh)
make dump version      # show current version info
```

---

## Development Workflow

### 1. Choose an Issue

Browse [open issues](https://github.com/cloudfoundry/stratos/issues):
- Look for `good-first-issue` labels for beginner-friendly tasks
- Comment on the issue to let others know you're working on it
- Ask questions if anything is unclear

### 2. Create a Feature Branch

All changes go to feature branches off `develop`. Never push directly to
`develop` or `master`.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

Branch naming:
- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `refactor/` — code restructuring
- `test/` — test improvements

### 3. Make Your Changes

```bash
# Two terminals
make dev backend       # Terminal 1
make dev frontend      # Terminal 2
```

The frontend auto-reloads on file changes. After Go changes, rebuild the
backend:

```bash
make dev-restart       # rebuilds backend binary
```

### 4. Write Tests

```bash
# Frontend (Vitest)
make test frontend          # all frontend tests
bun run test:core           # specific package
bun run test:watch          # watch mode for TDD
bun run test:coverage       # with coverage report

# Backend (Go)
make test backend

# E2E (Playwright)
bun run e2e                 # headless
bun run e2e:headed          # visible browser
bun run e2e:ui              # interactive UI
```

Guidelines:
- Add tests for new features
- Update tests for bug fixes
- Frontend: Vitest with Angular TestBed
- Backend: Go `testing` package with GoConvey

### 5. Commit Your Changes

```bash
git add src/frontend/packages/core/src/features/my-feature/
git commit
```

Commit message style:
- Subject line: max 48 characters, imperative mood
- Body: max 72 characters wide, explain *why* not *what*
- One atomic concept per commit
- Keep style changes separate from functional changes

```
Add user profile export to about page

Profile export allows admins to download user data as CSV
for audit compliance. Requested in issue #123.
```

Do **not** use the `<type>: <subject>` format (e.g., `feat: add export`).

### 6. Push and Create Pull Request

```bash
git push -u origin feature/my-feature
```

Create a PR against the `develop` branch:

```bash
gh pr create --base develop --title "Add user profile export" --body "
## Summary
- Added export button to about page
- CSV format for admin audit use

## Test plan
- [ ] Manual test on dev server
- [ ] Unit tests pass
- [ ] E2E test for export flow
"
```

Guidelines:
- Clear, descriptive title (under 70 characters)
- Link related issues
- Include testing notes
- Add screenshots for UI changes

### 7. Address Review Feedback

```bash
# Make requested changes, then commit as a new commit
git add .
git commit -m "Address review feedback on export format"
git push
```

---

## Project Structure

### Frontend (`src/frontend/packages/`)

```
packages/
├── core/           App shell, shared components, about/diagnostics pages
├── store/          NgRx state management, entity types, auth types
├── shared/         Cross-cutting utilities and services
├── cloud-foundry/  CF-specific pages (orgs, spaces, apps, services)
├── kubernetes/     K8s integration pages
├── cf-autoscaler/  CF autoscaler plugin UI
├── git/            Git integration UI
├── extension/      Extension system for custom modules
├── theme/          Theming (custom builder)
└── devkit/         Build tooling (prebuild scripts, extension generator)
```

Key technologies:
- Angular 20 with standalone components
- NgRx for state management
- RxJS for reactive programming
- Tailwind CSS for styling (preferred for new code)
- SCSS for pseudo-elements and complex selectors only
- Vitest for unit tests, Playwright for E2E

### Backend (`src/jetstream/`)

```
jetstream/
├── api/            Core API definitions and config structs
├── plugins/        Feature plugins
│   ├── cfapppush/      CF app deployment
│   ├── kubernetes/     K8s dashboard, terminal
│   ├── monocular/      Helm chart browser
│   ├── analysis/       Container analysis
│   └── userinvite/     Email-based invitations
├── repository/     Database layer (per-domain packages)
├── datastore/      Migrations (Goose, dialect-aware)
└── main.go         Entry point, config loading
```

Key technologies:
- Go 1.24.2
- Echo v4 HTTP framework
- PostgreSQL, MySQL/MariaDB, or SQLite (developer's choice)
- Goose for database migrations
- Plugin-based architecture

### Build System

The Makefile uses a verb + target pattern:

```bash
make build frontend       # build frontend only
make build backend        # build backend only
make build                # build both
make release cf           # package for Cloud Foundry
```

See `docs/build-and-packaging.md` for full details.

---

## Styling

Prefer Tailwind CSS utility classes for new code:

```html
<div class="flex flex-col gap-4 p-4">
  <h1 class="text-2xl font-bold">Title</h1>
  <button class="btn btn-primary">Action</button>
</div>
```

Use SCSS only when Tailwind can't express what you need (pseudo-elements,
complex selectors, animations).

---

## Database

Stratos supports PostgreSQL, MySQL/MariaDB, and SQLite. For local development,
SQLite is the default (zero setup).

For PostgreSQL (closer to production):

```bash
# Start Postgres via Docker, Podman, OrbStack, or Colima
docker compose up -d

# Update config.properties:
# DATABASE_PROVIDER=pgsql
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=stratos
# DB_PASSWORD=strat0s
# DB_DATABASE_NAME=stratosdb
```

Migrations run automatically on startup.

---

## AI Tool Usage

Cloud Foundry RFC-0047 (Accepted) requires disclosure of AI tooling used in
contributions. This applies to all CFF Technical Community projects including
Stratos.

**Required**: Disclose AI tool usage in your PR description, commit messages,
or by including the AI tool as a co-author on commits.

Examples of acceptable disclosure:

```
# In PR description
AI tools used: GitHub Copilot (code completion), Claude (architecture review)

# As commit co-author
Co-authored-by: Claude <claude@anthropic.com>
```

Additional guidelines:
- Review all AI-generated code before submitting — you are responsible for
  what you contribute
- AI-generated code must meet the same quality bar as hand-written code
- Approvers and Reviewers are exempt from disclosure requirements per RFC-0047

Reference: [RFC-0047 Require AI Tooling Disclosures](https://github.com/cloudfoundry/community/blob/main/toc/rfc/rfc-0047-ai-disclosures.md)

---

## Contribution Checklist

Before submitting a PR:

- [ ] Code follows existing patterns in the codebase
- [ ] Tests added for new features, updated for bug fixes
- [ ] All tests pass locally (`make test`)
- [ ] Linting passes (`make lint`)
- [ ] Commit messages use imperative mood, 48-char subjects
- [ ] PR targets the `develop` branch
- [ ] PR description is clear with testing notes
- [ ] No sensitive data in commits (.env, credentials, keys)
- [ ] AI usage acknowledged if applicable

---

## Getting Help

- **GitHub Issues**: Report bugs, request features
- **GitHub Discussions**: Ask questions, share ideas
- **Pull Requests**: Code reviews and feedback
- **Documentation**: `docs/` directory, `make help`

---

## Further Reading

- [Build and Packaging](build-and-packaging.md) — build system details
- [Developer Environment](developer-environment.md) — full toolchain reference
- [Pagination Architecture](pagination-architecture.md) — list/table patterns
- [Plugin Architecture](plugin-architecture.md) — backend plugin system
- [Secrets Management](secrets-management.md) — encryption key handling
