# Build and Packaging

Single source of truth for building, testing, and packaging Stratos.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 24+ | Frontend build tooling |
| Bun | 1.2+ | Package manager, script runner |
| Go | 1.25+ | Backend compilation |
| Git | any | Source control, `git archive` for source packages |
| `zip` | any | CF and Windows release archives |
| `swag` | optional | OpenAPI documentation generation |

## Operations Reference

### Building

| Command | What it does | Output |
|---------|-------------|--------|
| `make build` | Build frontend + all backend platforms | `dist/frontend/browser/`, `dist/bin/jetstream-{os}-{arch}` |
| `make build frontend` | Build frontend only (production) | `dist/frontend/browser/` |
| `make build backend` | Cross-compile backend for all platforms | `dist/bin/jetstream-{os}-{arch}` |
| `make build backend PLATFORM=linux/amd64` | Build backend for one platform | `dist/bin/jetstream` |
| `make build cf` | Build frontend + linux/amd64 backend (CF deploy) | `dist/frontend/browser/`, `dist/bin/jetstream` |

### Testing

| Command | What it does |
|---------|-------------|
| `make test` | Run all tests (frontend + backend) |
| `make test frontend` | Frontend tests only (Vitest) |
| `make test backend` | Backend tests only (Go) |
| `make test e2e` | Playwright E2E tests against deployed instance |

### Packaging and Release

| Command | Prerequisites | What it does | Output |
|---------|--------------|-------------|--------|
| `make stage` | `make build` | Stage artifacts for local testing | `dist/install/` with `run.sh` |
| `make release cf` | `make build` (linux/amd64) | Create CF-pushable zip | `dist/stratos-cf-{VERSION}.zip` |
| `make release github` | `make build` | Create all release archives | `dist/release/` (7 archives) |
| `make release` | All of the above | Create both CF zip and GitHub archives | Both |

### Development

| Command | What it does |
|---------|-------------|
| `make install` | Install dependencies (`bun install`) |
| `make dev frontend` | Start frontend dev server with hot reload |
| `make dev backend` | Start backend dev server |
| `make stage` | Stage production build into `dist/install/` for local testing |

### Clean

| Command | What it does |
|---------|-------------|
| `make clean` | Remove all build output (frontend, backend, release artifacts) |
| `make clean frontend` | Remove frontend build only (`dist/frontend/`, `.angular`) |
| `make clean backend` | Remove backend binaries only (`dist/bin/`) |
| `make clean dist` | Remove everything including `node_modules` |
| `make clean repo` | Full reset — everything gitignored |

### Metadata and Diagnostics

| Command | What it does |
|---------|-------------|
| `make stamp frontend` | Generate `build-info.ts` with version and git metadata |
| `make dump version` | Print resolved semver, VCS metadata, and Go ldflags |

### Common Workflows

**Local development:**

```bash
make build
make stage
dist/install/run.sh
```

**CF deployment:**

```bash
# Build and package in one command (cf modifier forces linux/amd64):
make build release cf

# Or with explicit version override:
make VERSION=v5.0.0 build release cf

# Deploy (via site.mk or manually):
cf target -o system -s stratos
cf push -f dist/cf-package/manifest.yml -p dist/stratos-cf-{VERSION}.zip
```

The `cf` modifier automatically sets `PLATFORM=linux/amd64` for backend
compilation. The version can be overridden without editing `package.json`.

Note: `cf push -p` does not read `manifest.yml` from inside the zip —
the manifest must be passed separately with `-f` or be in the current directory.

**GitHub release (automated via CI):**

```bash
make build
make release github
```

**Version override:**

Any make target respects `VERSION=` to override the version from `package.json`:

```bash
make VERSION=v5.0.0-rc.1 build release cf
make VERSION=v5.0.0 dump version
```

## Site-Specific Overrides (site.mk)

The Makefile supports site-specific customization through an optional `site.mk`
file. This file is loaded via `-include site.mk` at the end of the Makefile,
so it can extend or override any variable or target.

`site.mk` is gitignored — it is never committed. A `site.mk.example` is
provided as a starting point.

### When to use site.mk

Use `site.mk` for operations that depend on your deployment environment:

- Deploy targets (`make deploy cf`) with org/space configuration
- Environment-specific variable overrides
- Custom CI or automation targets
- Integration with site-specific tooling

Do **not** put secrets in `site.mk`. Use environment variables or a secrets
manager instead.

### Getting started

```bash
cp site.mk.example site.mk
# Edit site.mk to match your environment
```

### Adding help text

If your `site.mk` defines a `site-help` target, `make help` will include it
automatically:

```makefile
.PHONY: site-help
site-help:
	@echo ""
	@echo "Site-specific:"
	@echo "  make deploy cf    Push to current CF target"
```

Without a `site-help` target, `make help` shows a generic note that site.mk
exists. Without `site.mk` at all, nothing extra is shown.

### Design pattern

The Makefile uses a **verb + modifier** pattern where order does not matter:

```
make <verb> [modifier...]
make build cf              # verb=build, modifier=cf
make cf build release      # same modifiers, different order — same result
```

Modifiers are no-op targets that set flags. The `cf` modifier forces
`PLATFORM=linux/amd64` for build targets. Site-specific targets follow the
same pattern — `site.mk` adds new verbs (like `deploy`) that compose with
existing modifiers.

See `site.mk.example` for the full deploy target pattern.

## Validation Behavior

Release targets check for required artifacts before proceeding. If something
is missing, they print what's needed and exit:

```
ERROR: Frontend build not found at dist/frontend/browser/
  Run: make build frontend
```

```
ERROR: Backend binary not found at dist/bin/jetstream
  Run: make build backend
```

```
ERROR: Cross-compiled binaries missing: jetstream-linux-arm64 jetstream-darwin-amd64
  Run: make build backend
```

Packaging never auto-builds. This avoids the old problem where unwanted build
steps blocked packaging.

## Migration from Old Commands

| Old | New |
|-----|-----|
| `bin/package` | `make build && make release cf` |
| `bin/package --skip-build` | `make release cf` (validates artifacts exist) |
| `build/package.sh` | `make release github` |
| `make build-frontend` | `make build frontend` |
| `make build-backend` | `make build backend PLATFORM=linux/amd64` |
| `make build-backend-all` | `make build backend` |
| `make package` | `make release` |
| `make dev-frontend` | `make dev frontend` |
| `make dev-backend` | `make dev backend` |
| `make install` (old) | `make install` (unchanged — installs dependencies) |
| `make clean-dev` | `make clean` |
| `make clean-deep` | `make clean dist` |
| `make debug-version` | `make dump version` |

## Version and Build Metadata

The frontend and backend are built independently and may have different build
dates and VCS identifiers. The package itself carries a unified version.

### Package-level

| Variable | Source | Description |
|----------|--------|-------------|
| `VERSION` | `package.json` (or env override) | Unified package version |

### Frontend build metadata

Captured at prebuild via `build/store-git-metadata.js` into
`.stratos-git-metadata.json`:

| Field | Description |
|-------|-------------|
| `project` | Remote origin URL |
| `branch` | Branch name at build time |
| `commit` | Full commit SHA at build time |

### Backend build metadata

Injected via Go ldflags at compile time:

| Variable | Injected as | Description |
|----------|-------------|-------------|
| `VERSION` | `main.appVersion` | Package version |
| `BUILD_DATE` | `main.buildDate` | UTC timestamp at compile time |
| `GIT_COMMIT` | `main.gitCommit` | Short commit SHA at compile time |

### Build environment overrides

| Variable | Used by | Default | Description |
|----------|---------|---------|-------------|
| `PLATFORM` | `make build backend` | Host OS/arch | Target platform (`linux/amd64`, `darwin/arm64`, etc.) |
| `VERSION` | All targets | From `package.json` | Override version string |

Platform detection uses `uname` and normalizes to Go conventions (`darwin`,
`linux`, `amd64`, `arm64`). The `PLATFORM` variable accepts any separator:
`linux/amd64`, `linux-amd64`, or `linux_amd64`.

## Package Contents

### install (local testing)

```
dist/install/
  bin/jetstream          # symlink -> dist/bin/jetstream
  ui/                    # symlink -> dist/frontend/browser/
  config.properties      # copy from src/jetstream/config.example
  templates/             # copy from src/jetstream/templates/
  plugins.yaml           # copy from src/jetstream/plugins.yaml
  run.sh                 # wrapper that sets UI_PATH, TEMPLATE_DIR, execs jetstream
```

### release cf

```
dist/cf-package/ (zipped as stratos-cf-{VERSION}.zip)
  jetstream              # linux binary
  ui/                    # frontend assets
  config.properties      # from deploy/cloud-foundry/
  plugins.yaml           # from src/jetstream/
  templates/             # from src/jetstream/
  Procfile               # "web: ./jetstream"
  manifest.yml           # CF manifest (binary_buildpack)
```

### release github (per platform)

```
stratos-{VERSION}-{os}-{arch}.tar.gz (or .zip for Windows)
  bin/jetstream          # platform binary
  ui/                    # frontend assets
  config/config.example  # configuration template
  deploy/containers/     # Docker configs
  deploy/kubernetes/     # K8s configs
  LICENSE, README.md, CHANGELOG.md, VERSION, README.txt
```

Plus: `stratos-{VERSION}-src.tar.gz` via `git archive`

## Known Issues

### ENCRYPTION_KEY required (FWT-788)

`ENCRYPTION_KEY` must be explicitly set as an environment variable or in
`config.properties`. The old source-buildpack approach defaulted this via the
build script, but the pre-built binary approach does not generate a default.
If not set, jetstream fails to start with an encryption error.

For CF deployments, set it in the manifest or via `cf set-env`:

```bash
cf set-env console ENCRYPTION_KEY "$(openssl rand -hex 32)"
```
