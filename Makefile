# Stratos Makefile — verb + modifier pattern
#
# Usage:
#   make build                  Build frontend + all backend platforms
#   make build frontend         Build frontend only
#   make build backend          Cross-compile all backend platforms
#   make build backend PLATFORM=linux/amd64  Build single backend platform
#   make test                   Run all tests
#   make test frontend          Frontend tests only
#   make test backend           Backend tests only
#   make test e2e               Run Playwright E2E tests
#   make release                Release all targets (cf + github)
#   make release cf             CF-pushable zip
#   make release github         GitHub release archives
#   make install                Install dependencies
#   make stage                  Stage for local testing
#   make clean                  Remove all build output
#   make clean frontend         Remove frontend build only
#   make clean backend          Remove backend binaries only
#   make clean dist             Remove everything (including node_modules)
#   make check                  Run all quality gates (lint + gate)
#   make check e2e              Run Playwright E2E tests
#   make test e2e TIER=acceptance PR=1234   Tiered E2E run (see TESTING.md)
#   make e2e clean               Sweep stratos-e2e-test labeled CF resources
#   make stamp frontend         Generate build-info.ts with version metadata
#   make dump version           Print resolved version variables
#
# Variables:
#   FINAL=strip                 Strip prerelease from version (persisted)
#   DRYRUN=yes                  Preview actions without executing
#   VERSION=vX.Y.Z              Override version
#   PLATFORM=os/arch            Override target platform
#
# Debug: make _HIDE= <target>  — exposes all internal variables
#
# See docs/build-and-packaging.md for full documentation.

include version.mk

# ── Directories ───────────────────────────────────────────────
$(_HIDE)DIST_DIR    := dist
$(_HIDE)RELEASE_DIR := $($(_HIDE)DIST_DIR)/release
$(_HIDE)BIN_DIR     := $($(_HIDE)DIST_DIR)/bin

# ── Cross-cutting variables ───────────────────────────────────
# DRYRUN=yes   — preview actions without executing (any verb)
# FINAL=strip  — strip prerelease from version, persist to package.json
DRYRUN ?=
FINAL  ?=

# Literal comma — required because $(call) and $(subst) both use commas
# as argument separators, so a literal cannot appear inline.
$(_HIDE)COMMA := ,

# ── Platform detection ────────────────────────────────────────
# Override with: make build PLATFORM=linux/amd64
PLATFORM ?=
$(_HIDE)HOST_OS   := $(shell uname -s | tr '[:upper:]' '[:lower:]')
$(_HIDE)HOST_ARCH := $(patsubst x86_64,amd64,$(patsubst aarch64,arm64,$(shell uname -m)))

# Parse PLATFORM override or default to host
ifdef PLATFORM
  $(_HIDE)PLAT_WORDS := $(subst /, ,$(subst -, ,$(subst _, ,$(PLATFORM))))
  $(_HIDE)TARGET_OS   := $(word 1,$($(_HIDE)PLAT_WORDS))
  $(_HIDE)TARGET_ARCH := $(or $(word 2,$($(_HIDE)PLAT_WORDS)),$($(_HIDE)HOST_ARCH))
else
  $(_HIDE)TARGET_OS   := $($(_HIDE)HOST_OS)
  $(_HIDE)TARGET_ARCH := $($(_HIDE)HOST_ARCH)
endif

$(_HIDE)CURRENT_PLATFORM := $($(_HIDE)TARGET_OS)/$($(_HIDE)TARGET_ARCH)

# Cross-compilation: set GOOS/GOARCH when target differs from host
$(_HIDE)GO_ENV :=
ifneq ($($(_HIDE)TARGET_OS),$($(_HIDE)HOST_OS))
  $(_HIDE)GO_ENV += GOOS=$($(_HIDE)TARGET_OS)
endif
ifneq ($($(_HIDE)TARGET_ARCH),$($(_HIDE)HOST_ARCH))
  $(_HIDE)GO_ENV += GOARCH=$($(_HIDE)TARGET_ARCH)
endif

# ── Modifier flags ───────────────────────────────────────────
$(_HIDE)WANT_FRONTEND :=
$(_HIDE)WANT_BACKEND  :=
$(_HIDE)WANT_E2E      :=
$(_HIDE)WANT_WEBSITE  :=
$(_HIDE)WANT_BOOKLETS :=

ifneq ($(filter frontend,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_FRONTEND := yes
endif
ifneq ($(filter backend,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_BACKEND := yes
endif
ifneq ($(filter e2e,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_E2E := yes
endif
ifneq ($(filter website,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_WEBSITE := yes
endif
ifneq ($(filter booklets,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_BOOKLETS := yes
endif

# Default: frontend + backend when none specified (unless e2e),
# but only for verbs that use these modifiers (not clean/dump).
# korifi counts as a build modifier here (make build korifi = static
# backend only), so it must suppress the default like the others.
ifneq ($(filter build test dev stamp,$(MAKECMDGOALS)),)
ifeq ($($(_HIDE)WANT_FRONTEND)$($(_HIDE)WANT_BACKEND)$($(_HIDE)WANT_E2E)$($(_HIDE)WANT_WEBSITE)$($(_HIDE)WANT_BOOKLETS)$(filter korifi,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_FRONTEND := yes
  $(_HIDE)WANT_BACKEND  := yes
endif
endif

$(_HIDE)WANT_CF     :=
$(_HIDE)WANT_KORIFI :=
$(_HIDE)WANT_GITHUB :=
$(_HIDE)WANT_PAGES  :=

ifneq ($(filter cf,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_CF := yes
endif
ifneq ($(filter pages,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_PAGES := yes
endif
ifneq ($(filter korifi,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_KORIFI := yes
endif
ifneq ($(filter github,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_GITHUB := yes
endif
ifneq ($(filter release,$(MAKECMDGOALS)),)
ifeq ($($(_HIDE)WANT_CF)$($(_HIDE)WANT_KORIFI)$($(_HIDE)WANT_GITHUB),)
  $(_HIDE)WANT_CF     := yes
  $(_HIDE)WANT_GITHUB := yes
endif
endif

$(_HIDE)WANT_VERSION :=
$(_HIDE)WANT_ACTIONS :=

ifneq ($(filter version,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_VERSION := yes
endif
ifneq ($(filter actions,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_ACTIONS := yes
endif
# Default: version + actions when none specified for dump
ifneq ($(filter dump,$(MAKECMDGOALS)),)
ifeq ($($(_HIDE)WANT_VERSION)$($(_HIDE)WANT_ACTIONS),)
  $(_HIDE)WANT_VERSION := yes
  $(_HIDE)WANT_ACTIONS := yes
endif
endif

$(_HIDE)WANT_PACKAGES :=
$(_HIDE)WANT_SECRETS  :=
$(_HIDE)WANT_TREE     :=
$(_HIDE)WANT_HISTORY  :=
$(_HIDE)WANT_LICENSES :=

ifneq ($(filter packages,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_PACKAGES := yes
endif
ifneq ($(filter secrets,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_SECRETS := yes
endif
ifneq ($(filter tree,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_TREE := yes
endif
ifneq ($(filter history,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_HISTORY := yes
endif
ifneq ($(filter licenses,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_LICENSES := yes
endif

# cf modifier defaults to linux/amd64 unless PLATFORM is set
ifeq ($($(_HIDE)WANT_CF),yes)
  ifndef PLATFORM
    PLATFORM := linux/amd64
    $(_HIDE)TARGET_OS   := linux
    $(_HIDE)TARGET_ARCH := amd64
    $(_HIDE)GO_ENV      := GOOS=linux GOARCH=amd64
    $(_HIDE)CURRENT_PLATFORM := linux/amd64
  endif
endif

# korifi modifier targets linux at the host arch unless PLATFORM is set
# (a local kind cluster runs the host arch; real clusters override,
# e.g. make build korifi PLATFORM=linux/amd64)
ifeq ($($(_HIDE)WANT_KORIFI),yes)
  ifndef PLATFORM
    PLATFORM := linux/$($(_HIDE)HOST_ARCH)
    $(_HIDE)TARGET_OS   := linux
    $(_HIDE)TARGET_ARCH := $($(_HIDE)HOST_ARCH)
    $(_HIDE)GO_ENV      := GOOS=linux GOARCH=$($(_HIDE)HOST_ARCH)
    $(_HIDE)CURRENT_PLATFORM := linux/$($(_HIDE)HOST_ARCH)
  endif
endif

$(_HIDE)WANT_CLEAN_DIST :=
$(_HIDE)WANT_LINT       :=
$(_HIDE)WANT_GATE       :=
$(_HIDE)WANT_TESTS      :=
$(_HIDE)WANT_COVERAGE   :=
$(_HIDE)WANT_SUMMARY    :=
$(_HIDE)WANT_DEPENDABOT :=

ifneq ($(filter dist,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_CLEAN_DIST := yes
endif
ifneq ($(filter lint,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_LINT := yes
endif
ifneq ($(filter gate,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_GATE := yes
endif
ifneq ($(filter tests,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_TESTS := yes
endif
ifneq ($(filter coverage,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_COVERAGE := yes
endif
ifneq ($(filter summary,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_SUMMARY := yes
endif
ifneq ($(filter dependabot,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_DEPENDABOT := yes
endif
# Default: all checks when none specified
ifneq ($(filter check,$(MAKECMDGOALS)),)
ifeq ($($(_HIDE)WANT_LINT)$($(_HIDE)WANT_GATE)$($(_HIDE)WANT_TESTS)$($(_HIDE)WANT_COVERAGE)$($(_HIDE)WANT_E2E),)
  $(_HIDE)WANT_LINT     := yes
  $(_HIDE)WANT_GATE     := yes
endif
endif
# Default: all scanners for audit when no modifier given
ifneq ($(filter audit,$(MAKECMDGOALS)),)
ifeq ($($(_HIDE)WANT_FRONTEND)$($(_HIDE)WANT_BACKEND)$($(_HIDE)WANT_SUMMARY)$($(_HIDE)WANT_ACTIONS)$($(_HIDE)WANT_PACKAGES)$($(_HIDE)WANT_SECRETS)$($(_HIDE)WANT_TESTS)$($(_HIDE)WANT_TREE)$($(_HIDE)WANT_HISTORY)$($(_HIDE)WANT_LICENSES),)
  $(_HIDE)WANT_FRONTEND := yes
  $(_HIDE)WANT_BACKEND  := yes
  $(_HIDE)WANT_ACTIONS  := yes
  $(_HIDE)WANT_PACKAGES := yes
  $(_HIDE)WANT_SECRETS  := yes
endif
endif
# Default: frontend + backend for outdated when no modifier given
ifneq ($(filter outdated,$(MAKECMDGOALS)),)
ifeq ($($(_HIDE)WANT_FRONTEND)$($(_HIDE)WANT_BACKEND)$($(_HIDE)WANT_SUMMARY),)
  $(_HIDE)WANT_FRONTEND := yes
  $(_HIDE)WANT_BACKEND  := yes
endif
endif

# No-op targets so modifiers don't error
# Note: lint has its own standalone recipe — not listed here.
.PHONY: frontend backend website booklets cf korifi github pages dist version e2e actions packages secrets gate tests coverage summary dependabot tree history licenses
frontend backend website booklets cf korifi github pages dist version e2e actions packages secrets gate tests coverage summary dependabot tree history licenses:
	@:

# No-op targets for bump modifiers (consumed by BUMP_MOD filter).
.PHONY: major minor patch rc alpha beta prerelease
major minor patch rc alpha beta prerelease:
	@:

# ── Load action registry ─────────────────────────────────────
# Variable path prevents tab-completion parsers from following
# the include (template syntax would confuse static parsers).
$(_HIDE)ACTIONS := actions
include $($(_HIDE)ACTIONS).mk

# ══════════════════════════════════════════════════════════════
# Object definitions — grouped by component, not by verb.
# Each section defines all actions for one component.
# ══════════════════════════════════════════════════════════════

# ── Frontend ──────────────────────────────────────────────────

define build.frontend
	@echo "Building frontend (production)..."
	bun run build
	@echo "Frontend built: $($(_HIDE)DIST_DIR)/frontend/browser/"
endef
$(call register, build, frontend, $(_HIDE)stamp.frontend)

# Optional narrowing for the edit-test loop:
#   PROJECT=<vitest project(s)>  e.g. PROJECT=core or PROJECT="core git"
#   SCOPE=<path filter(s)>       e.g. SCOPE=src/frontend/packages/core/src/shared/components/stepper
# The npm `test` script hard-codes every --project, so narrowed runs
# invoke vitest directly with the same unhandled-errors flag.
define test.frontend
	@echo "Running frontend tests..."
	$(if $(strip $(PROJECT)$(SCOPE)),bun run vitest run --dangerouslyIgnoreUnhandledErrors $(foreach p,$(PROJECT),--project $(p)) $(SCOPE),bun run test)
endef
$(call register, test, frontend)

define clean.frontend
	rm -rf $($(_HIDE)DIST_DIR)/frontend .angular dist-devkit
endef
$(call register, clean, frontend)

define dev.frontend
	BACKEND_PORT=$(BACKEND_PORT) bun run ng serve --port $(FRONTEND_PORT) --proxy-config proxy.conf.cjs
endef
$(call register, dev, frontend)

# stamp.frontend recipe is defined in version.mk (shared library)
$(call register, stamp, frontend)

# ── Backend ───────────────────────────────────────────────────

# extra_plugins.go is generated from plugin-config.yaml (gitignored), so a
# fresh checkout compiles a plugin-less jetstream unless generation runs
# first. Internal prerequisite of every backend build; hidden from help.
.PHONY: $(_HIDE)gen-plugins
$(_HIDE)gen-plugins:
	cd src/jetstream && go generate ./...

define build.backend
	@if [ -n "$(PLATFORM)" ]; then \
		echo "Building backend for $($(_HIDE)CURRENT_PLATFORM)..."; \
		mkdir -p $($(_HIDE)BIN_DIR); \
		cd src/jetstream && $($(_HIDE)GO_ENV) go build -ldflags "$($(_HIDE)GO_LDFLAGS)" -o ../../$($(_HIDE)BIN_DIR)/jetstream; \
		echo "Backend built: $($(_HIDE)BIN_DIR)/jetstream"; \
	else \
		echo "Cross-compiling backend for all platforms..."; \
		chmod +x build/cross-compile.sh; \
		./build/cross-compile.sh "$($(_HIDE)SEMVER_VERSION)" "$($(_HIDE)BUILD_DATE)" "$($(_HIDE)BUILD_VCS_ID)"; \
		echo "All platform binaries built: $($(_HIDE)BIN_DIR)/"; \
	fi
endef
$(call register, build, backend, $(_HIDE)gen-plugins)

define test.backend
	@echo "Running backend tests..."
	cd src/jetstream && go test ./... -v -count=1
endef
$(call register, test, backend)

define clean.backend
	rm -rf $($(_HIDE)DIST_DIR)/bin
	cd src/jetstream && rm -f jetstream jetstream.exe jetstream.darwin
endef
$(call register, clean, backend)

define dev.backend
	@NEED_BUILD=false; \
	if [ ! -f $($(_HIDE)BIN_DIR)/jetstream ]; then \
		NEED_BUILD=true; \
	elif ! file $($(_HIDE)BIN_DIR)/jetstream | grep -qi "$$(uname -s)"; then \
		echo "Backend binary is not for this platform, rebuilding..."; \
		NEED_BUILD=true; \
	fi; \
	if [ "$$NEED_BUILD" = true ]; then \
		echo "Building backend for host platform..."; \
		$(MAKE) build backend PLATFORM=$($(_HIDE)HOST_OS)/$($(_HIDE)HOST_ARCH); \
	fi
	cd src/jetstream && CONSOLE_PROXY_TLS_ADDRESS=:$(BACKEND_PORT) SESSION_STORE_EXPIRY=$(SESSION_STORE_EXPIRY) ../../$($(_HIDE)BIN_DIR)/jetstream
endef
$(call register, dev, backend)

# ── Website (documentation site) ──────────────────────────────

define build.website
	@echo "Building documentation website..."
	cd website && bun install --frozen-lockfile && bun run build
	@echo "Website built: website/build/"
endef
$(call register, build, website)

define dev.website
	cd website && bun install --frozen-lockfile && bun run start
endef
$(call register, dev, website)

define clean.website
	rm -rf website/build website/.docusaurus website/node_modules
endef
$(call register, clean, website)

# ── Booklets (offline epub/PDF renderings of docs/) ──────────

define build.booklets
	@echo "Rendering documentation booklets..."
	docs-build/render.sh
	@echo "Booklets rendered: dist/booklets/"
endef
$(call register, build, booklets)

define clean.booklets
	rm -rf dist/booklets
endef
$(call register, clean, booklets)

# Local dev session expiry. Mirrors the cf-package deploy default
# (`build/release-cf.sh`) so long Playwright drives don't get bounced
# back to /login mid-session. Override on the make line if needed.
SESSION_STORE_EXPIRY ?= 240

# ── E2E variables (consumed by test.e2e and check.e2e) ──
# These are recipe-local, not cross-cutting. DRYRUN=yes is the
# existing cross-cutting variable (wired to bump); the e2e recipes
# also consume it, mapping to Playwright's --list.
E2E_BROWSERS    ?=
E2E_TRACE       ?=
E2E_VIDEO       ?=
E2E_SCREENSHOTS ?=

# Tiered selection (see TESTING.md "Tiered E2E runs"). Comma lists.
# TIER/GROUP set → recipe delegates to scripts/e2e-run.mjs and the
# browser default becomes all three (E2E_BROWSERS still overrides).
TIER            ?=
GROUP           ?=
PR              ?=

# Extra zizmor flags for `make audit actions` (e.g. --persona=auditor)
ZIZMOR_FLAGS    ?=

# Helpers — translate the variables above into Playwright CLI flags.

# Convert "a,b,c" → "--project=a --project=b --project=c"
# Empty → "--project=chromium" (default)
# "all" → ""                    (no filter; runs every project in playwright.config.ts)
_e2e_browsers = $(if $(1),$(if $(filter all,$(1)),,$(addprefix --project=,$(subst $($(_HIDE)COMMA), ,$(1)))),--project=chromium)

# Emit '--name value' iff value is non-empty
_e2e_flag = $(if $(2),--$(1) $(2),)

# Emit '--name' iff value == "yes"
_e2e_toggle = $(if $(filter yes,$(2)),--$(1),)

# ── E2E ───────────────────────────────────────────────────────

# The local webServer needs a host-runnable jetstream at dist/bin/jetstream;
# cross-compiles leave a foreign binary there (exit 126). Skipped when
# E2E_BASE_URL targets a remote deployment (no local server started).
define _ensure_host_backend
	@if [ -z "$(E2E_BASE_URL)" ]; then \
		NEED_BUILD=false; \
		case "$$(uname -s)" in Darwin) BINFMT="Mach-O";; *) BINFMT="ELF";; esac; \
		if [ ! -f $($(_HIDE)BIN_DIR)/jetstream ]; then \
			NEED_BUILD=true; \
		elif ! file $($(_HIDE)BIN_DIR)/jetstream | grep -q "$$BINFMT"; then \
			echo "Backend binary is not for this platform - rebuilding for $($(_HIDE)HOST_OS)/$($(_HIDE)HOST_ARCH)..."; \
			NEED_BUILD=true; \
		fi; \
		if [ "$$NEED_BUILD" = true ]; then \
			$(MAKE) build backend PLATFORM=$($(_HIDE)HOST_OS)/$($(_HIDE)HOST_ARCH); \
		fi; \
	fi
endef

define test.e2e
	$(_ensure_host_backend)
	@if [ -n "$(TIER)$(GROUP)" ]; then \
		echo "Running tiered E2E tests..."; \
		$(if $(E2E_VIDEO),E2E_VIDEO=$(E2E_VIDEO) )$(if $(E2E_SCREENSHOTS),E2E_SCREENSHOTS=$(E2E_SCREENSHOTS) )node scripts/e2e-run.mjs \
			$(if $(TIER),--tier $(TIER) )$(if $(GROUP),--group $(GROUP) )--browsers $(or $(E2E_BROWSERS),all) \
			$(if $(PR),--pr $(PR) )$(call _e2e_toggle,dry-run,$(DRYRUN)); \
	else \
		echo "Running Playwright E2E tests..."; \
		$(if $(E2E_VIDEO),E2E_VIDEO=$(E2E_VIDEO) )$(if $(E2E_SCREENSHOTS),E2E_SCREENSHOTS=$(E2E_SCREENSHOTS) )npx playwright test \
			$(call _e2e_browsers,$(E2E_BROWSERS)) \
			$(call _e2e_flag,trace,$(E2E_TRACE)) \
			$(call _e2e_toggle,list,$(DRYRUN)); \
	fi
endef
$(call register, test, e2e)

# make e2e clean — sweep stratos-e2e-test labeled CF resources left behind
# by e2e runs (apps/routes/service instances/spaces/orgs). Direct CF API,
# no Playwright — see scripts/e2e-clean.mjs. Deliberately not run as part
# of any test/check recipe; an operator runs it between runs.
define clean.e2e
	@echo "Sweeping stratos-e2e-test labeled CF resources..."
	DRYRUN=$(DRYRUN) node scripts/e2e-clean.mjs
endef
$(call register, clean, e2e)

# ── Check (quality gates) ────────────────────────────────────
# make check          — lint + gate (default)
# make check lint     — ESLint + go vet + golangci-lint
# make check gate     — lint + unit tests + production build (= bun run gate-check)
# make check tests    — unit tests only
# make check coverage — unit tests with coverage
# make check e2e      — Playwright E2E core tests

define check.lint
	@echo "Running lint checks..."
	@which golangci-lint > /dev/null 2>&1 || (echo "golangci-lint not installed. See https://golangci-lint.run/welcome/install/ (macOS: brew install golangci-lint)" >&2 && exit 1)
	bun run lint
	cd src/jetstream && go fmt ./... && go vet ./...
	cd src/jetstream && golangci-lint run ./...
	cd src/jetstream/api && golangci-lint run ./...
endef
$(call register, check, lint)

define check.gate
	@echo "Running gate checks (lint + unit tests + production build)..."
	bun run gate-check
	cd src/jetstream && go test ./... -v -count=1
endef
$(call register, check, gate)

define check.tests
	@echo "Running unit tests..."
	bun run test
	cd src/jetstream && go test ./... -v -count=1
endef
$(call register, check, tests)

define check.coverage
	@echo "Running unit tests with coverage..."
	bun run test -- --coverage
endef
$(call register, check, coverage)

define check.e2e
	$(_ensure_host_backend)
	@echo "Running Playwright E2E core tests..."
	@$(if $(E2E_VIDEO),E2E_VIDEO=$(E2E_VIDEO) )$(if $(E2E_SCREENSHOTS),E2E_SCREENSHOTS=$(E2E_SCREENSHOTS) )npx playwright test e2e/tests/core/ \
		$(call _e2e_browsers,$(E2E_BROWSERS)) \
		$(call _e2e_flag,trace,$(E2E_TRACE)) \
		$(call _e2e_toggle,list,$(DRYRUN))
endef
$(call register, check, e2e)

# ── Audit (security scanning) ────────────────────────────────
# make audit              — default scanners (frontend backend actions packages secrets)
# make audit frontend     — bun audit (npm advisory DB)
# make audit backend      — gosec + trivy + govulncheck (both Go modules)
# make audit actions      — zizmor (GitHub Actions workflow SAST)
#                           ZIZMOR_FLAGS="--persona=auditor" for the strict rule set
# make audit packages     — osv-scanner (all lockfiles + go.mods, one pass)
# make audit secrets      — gitleaks (working-tree secret scan)
# make audit tests        — gosec including _test.go files + #nosec suppression report
# make audit tree         — trivy over the whole tree (deploy/ Dockerfiles, helm, manifests)
# make audit history      — gitleaks full git-history secret scan (slow)
# make audit licenses     — osv-scanner dependency license report
# make audit summary      — high/moderate/low counts only

define audit.frontend
	@echo "Running frontend audit (bun audit)..."
	@bun audit || true
endef
$(call register, audit, frontend)

define audit.backend
	@echo "Running backend security scans..."
	@which gosec > /dev/null 2>&1 || (echo "gosec not installed. Run: go install github.com/securego/gosec/v2/cmd/gosec@latest" >&2 && exit 1)
	@which trivy > /dev/null 2>&1 || (echo "trivy not installed. See https://github.com/aquasecurity/trivy" >&2 && exit 1)
	@which govulncheck > /dev/null 2>&1 || (echo "govulncheck not installed. Run: go install golang.org/x/vuln/cmd/govulncheck@latest" >&2 && exit 1)
	@echo "── gosec ──"
	cd src/jetstream && gosec -quiet ./... || true
	cd src/jetstream/api && gosec -quiet ./... || true
	@echo "── trivy ──"
	trivy fs --scanners vuln,misconfig src/jetstream || true
	@echo "── govulncheck ──"
	cd src/jetstream && govulncheck ./... || true
	cd src/jetstream/api && govulncheck ./... || true
endef
$(call register, audit, backend)

define audit.actions
	@echo "Running GitHub Actions workflow audit (zizmor)..."
	@which zizmor > /dev/null 2>&1 || (echo "zizmor not installed. Run: brew install zizmor" >&2 && exit 1)
	@if command -v gh > /dev/null 2>&1 && gh auth token > /dev/null 2>&1; then \
		GH_TOKEN=$$(gh auth token) zizmor $(ZIZMOR_FLAGS) .github/workflows/ || true; \
	else \
		zizmor --offline $(ZIZMOR_FLAGS) .github/workflows/ || true; \
	fi
endef
$(call register, audit, actions)

define audit.packages
	@echo "Running dependency audit (osv-scanner)..."
	@which osv-scanner > /dev/null 2>&1 || (echo "osv-scanner not installed. Run: brew install osv-scanner" >&2 && exit 1)
	@osv-scanner scan source -r . || true
endef
$(call register, audit, packages)

define audit.secrets
	@echo "Running secret scan (gitleaks)..."
	@which gitleaks > /dev/null 2>&1 || (echo "gitleaks not installed. Run: brew install gitleaks" >&2 && exit 1)
	@gitleaks dir . --no-banner --redact || true
endef
$(call register, audit, secrets)

define audit.tests
	@echo "Running gosec including test files..."
	@which gosec > /dev/null 2>&1 || (echo "gosec not installed. Run: go install github.com/securego/gosec/v2/cmd/gosec@latest" >&2 && exit 1)
	cd src/jetstream && gosec -quiet -tests -track-suppressions ./... || true
	cd src/jetstream/api && gosec -quiet -tests -track-suppressions ./... || true
endef
$(call register, audit, tests)

define audit.tree
	@echo "Running full-tree scan (trivy)..."
	@which trivy > /dev/null 2>&1 || (echo "trivy not installed. See https://github.com/aquasecurity/trivy" >&2 && exit 1)
	trivy fs --scanners vuln,misconfig --skip-dirs '**/node_modules' --skip-dirs '**/dist' . || true
endef
$(call register, audit, tree)

define audit.history
	@echo "Running full git-history secret scan (gitleaks)..."
	@which gitleaks > /dev/null 2>&1 || (echo "gitleaks not installed. Run: brew install gitleaks" >&2 && exit 1)
	gitleaks git . --no-banner --redact || true
endef
$(call register, audit, history)

define audit.licenses
	@echo "Running dependency license report (osv-scanner)..."
	@which osv-scanner > /dev/null 2>&1 || (echo "osv-scanner not installed. Run: brew install osv-scanner" >&2 && exit 1)
	osv-scanner scan source --licenses -r . || true
endef
$(call register, audit, licenses)

define audit.summary
	@echo "── Frontend (bun audit) ──"
	@bun audit 2>&1 | grep -E "^[0-9]+ vulnerabilities" || echo "no summary line"
	@echo "── Backend (govulncheck) ──"
	@cd src/jetstream && govulncheck ./... 2>&1 | grep -E "^Your code is affected|This scan also found" || echo "no findings"
endef
$(call register, audit, summary)

# ── Outdated (upgrade discovery) ─────────────────────────────
# make outdated           — frontend + backend
# make outdated frontend  — bun outdated (direct deps with available upgrades)
# make outdated backend   — go list -m -u all (modules with updates)

define outdated.frontend
	@echo "Running frontend outdated check (bun outdated)..."
	@bun outdated || true
endef
$(call register, outdated, frontend)

define outdated.backend
	@echo "Running backend outdated check (go list -m -u all)..."
	@cd src/jetstream && go list -m -u all 2>&1 | grep '\[' || echo "no module updates available"
endef
$(call register, outdated, backend)

# ── Deps (dependency management helpers) ─────────────────────
# make deps              — defaults to dependabot listing
# make deps dependabot   — list open dependency PRs from GitHub

define deps.dependabot
	@which gh > /dev/null 2>&1 || (echo "gh not installed. See https://cli.github.com/" >&2 && exit 1)
	@echo "Open dependency PRs:"
	@gh pr list --label dependencies --state open --limit 50 \
		--json number,title,createdAt,author \
		--template '{{range .}}  #{{.number}}  {{.title}}  ({{timeago .createdAt}}, {{.author.login}}){{"\n"}}{{end}}'
endef
$(call register, deps, dependabot)

# ── CF release ────────────────────────────────────────────────

define release.cf
	@chmod +x build/release-cf.sh
	@./build/release-cf.sh "$($(_HIDE)SEMVER_VERSION)"
endef
$(call register, release, cf)

# ── Korifi ────────────────────────────────────────────────────
# Korifi runs droplets on the Paketo jammy run image, which has no
# glibc loader at the paths a dynamically linked cgo binary expects,
# and the sqlite driver needs cgo — so the binary must be a static
# cgo build (zig/musl). Korifi also has no binary_buildpack; the
# package manifest uses paketo-buildpacks/procfile instead.

define build.korifi
	@command -v zig > /dev/null 2>&1 || (echo "zig not installed — required for the static cgo cross-compile. Install: brew install zig" >&2 && exit 1)
	@echo "Building static backend for $($(_HIDE)CURRENT_PLATFORM) (Korifi)..."
	@mkdir -p $($(_HIDE)BIN_DIR)
	cd src/jetstream && CGO_ENABLED=1 GOOS=linux GOARCH=$($(_HIDE)TARGET_ARCH) \
		CC="zig cc -target $(if $(filter arm64,$($(_HIDE)TARGET_ARCH)),aarch64,x86_64)-linux-musl" \
		go build -ldflags "$($(_HIDE)GO_LDFLAGS) -linkmode external -extldflags -static" \
		-o ../../$($(_HIDE)BIN_DIR)/jetstream
	@echo "Backend built (static): $($(_HIDE)BIN_DIR)/jetstream"
endef
$(call register, build, korifi, $(_HIDE)gen-plugins)

define release.korifi
	@chmod +x build/release-cf.sh
	@./build/release-cf.sh "$($(_HIDE)SEMVER_VERSION)" korifi
endef
$(call register, release, korifi)

# ── GitHub release ────────────────────────────────────────────

define release.github
	@chmod +x build/release-github.sh
	@./build/release-github.sh "$($(_HIDE)SEMVER_VERSION)"
endef
$(call register, release, github)

# ── Deploy (documentation website) ───────────────────────────
# Grammar: make deploy website <destination> — the component says what is
# deployed, the destination says where. Destinations here are mechanisms
# with no environment baked in; site-specific values live in site.mk.
#
#   make deploy website pages   Push HEAD to your fork's pages-preview
#                               branch; the Deploy Website workflow builds
#                               and publishes your fork's Pages site.
#                               One-time fork setup: see README.
#   make deploy website cf      cf push the built site to the current
#                               cf target (cf login / cf target first).
#   make build deploy website cf    Build locally, then push.
#
# App deployment (the zip from `make release cf`) is site-specific —
# site.mk redefines deploy.cf to add it (see site.mk.example).

# Remote the pages-preview branch is pushed to. `origin` is right when
# your clone's origin is your fork; override in site.mk otherwise.
PAGES_REMOTE ?= origin

# Destination words for `deploy website`. site.mk appends custom ones
# (WEBSITE_DEPLOY_DESTS += mysite) so the usage guard stays accurate.
WEBSITE_DEPLOY_DESTS := pages cf

# Plain --force: pages-preview is a disposable deploy trigger that never
# holds work, and --force-with-lease fails without a remote-tracking ref.
define deploy.pages
	@git remote get-url $(PAGES_REMOTE) >/dev/null 2>&1 || \
		{ echo "ERROR: remote '$(PAGES_REMOTE)' not found — set PAGES_REMOTE to your fork remote (site.mk or make line)." >&2; exit 1; }
	@echo "Pushing HEAD to $(PAGES_REMOTE)/pages-preview (GitHub Pages preview)..."
	git push --force $(PAGES_REMOTE) HEAD:refs/heads/pages-preview
	@echo "The fork's 'Deploy Website' workflow now builds and publishes the site."
endef
$(call register, deploy, pages)

define deploy.cf
	@if [ -n "$($(_HIDE)WANT_WEBSITE)" ]; then \
		echo "Deploying documentation website to CF..."; \
		cf target 2>/dev/null | grep -qE "org:.+" || \
			{ echo "ERROR: no CF target / not logged in. Run 'cf login' then 'cf target -o ORG -s SPACE'." >&2; exit 1; }; \
		[ -d website/build ] || \
			{ echo "ERROR: website/build not found. Run 'make build website' first." >&2; exit 1; }; \
		cf push -f website/manifest.yml; \
	else \
		$(MAKE) --no-print-directory $(_HIDE)deploy.cf.app; \
	fi
endef
$(call register, deploy, cf)

# App deploys carry site knowledge; site.mk redefines this recipe variable
# (define deploy.cf.app ... endef) to enable them — see site.mk.example.
define deploy.cf.app
	@echo "ERROR: app deployment to CF is site-specific — see site.mk.example." >&2
	@exit 1
endef
$(call register_always, deploy, cf.app)

# Bare `make deploy website` (no destination word) → usage, not a no-op.
define deploy.website
	@if [ -z "$(filter $(WEBSITE_DEPLOY_DESTS),$(MAKECMDGOALS))" ]; then \
		echo "Usage: make deploy website <destination>" >&2; \
		echo "Destinations: $(WEBSITE_DEPLOY_DESTS)" >&2; \
		exit 1; \
	fi
endef
$(call register, deploy, website)

# Bare `make deploy` → usage.
define deploy.usage
	@echo "Usage: make deploy website <destination>"
	@echo "Destinations: $(WEBSITE_DEPLOY_DESTS)"
	@echo "App deployment is site-specific — see site.mk.example."
endef
$(call register_always, deploy, usage)

# ══════════════════════════════════════════════════════════════
# Verb wiring — declare each verb after all objects are registered.
# ══════════════════════════════════════════════════════════════

# ── FINAL=strip — finalize version, then re-exec without FINAL ──
# Strips prerelease from package.json and re-invokes Make so all
# version variables resolve fresh from the updated package.json.
# Uses MAKEOVERRIDES filter to prevent FINAL from propagating.
ifeq ($(FINAL),strip)
.PHONY: $(_HIDE)finalize-and-reexec
$(_HIDE)finalize-and-reexec:
	@echo "Finalizing version (stripping prerelease)..."
	@chmod +x build/version-bump.sh
	@./build/version-bump.sh bump release
	@echo "Re-running: $(MAKE) $(MAKECMDGOALS)"
	@$(MAKE) FINAL= $(MAKECMDGOALS)
$(filter-out frontend backend cf korifi github dist version e2e actions packages secrets lint gate tests coverage tree history licenses,$(MAKECMDGOALS)): $(_HIDE)finalize-and-reexec ; @:
else ifneq ($(FINAL),)
$(error Unknown FINAL value '$(FINAL)' — supported: strip)
endif

# ── Cross-cutting modifier allowances ────────────────────────
# These modifiers affect build behavior through variables (e.g.,
# cf forces PLATFORM=linux/amd64) rather than via a registered recipe.
$(call allow, build, cf)
$(call allow, build, pages)

$(call declare_verb, build)
$(call declare_verb, test)
$(call declare_verb, release)
$(call declare_verb_default, deploy, $(_HIDE)deploy.usage)
$(call declare_verb, stamp)
$(call declare_verb, check)
$(call declare_verb, audit)
$(call declare_verb, outdated)
$(call declare_verb_default, deps, $(_HIDE)deps.dependabot)
# Skip dev verb declaration when 'dev' is used as a bump modifier
ifeq ($(filter bump,$(MAKECMDGOALS)),)
$(call declare_verb, dev)
else
.PHONY: dev
dev: ;@:
endif

# ── Stamp defaults ────────────────────────────────────────────
# stamp with no modifier stamps frontend
ifeq ($($(_HIDE)WANT_FRONTEND)$($(_HIDE)WANT_BACKEND),)
stamp: $(_HIDE)stamp.frontend
endif

# ── Clean (special behavior) ─────────────────────────────────
# make clean           — build output + release artifacts
# make clean frontend  — frontend build only
# make clean backend   — backend binaries only
# make clean dist      — above + node_modules
# make e2e clean        — sweep stratos-e2e-test labeled CF resources
#                         (defined in the E2E section, above)

define clean.release
	rm -rf $($(_HIDE)DIST_DIR)/release $($(_HIDE)DIST_DIR)/cf-package $($(_HIDE)DIST_DIR)/korifi-package $($(_HIDE)DIST_DIR)/install $($(_HIDE)DIST_DIR)/stratos-cf-*.zip $($(_HIDE)DIST_DIR)/stratos-korifi-*.zip
endef

define clean.dist
	rm -rf $($(_HIDE)DIST_DIR)/frontend .angular dist-devkit $($(_HIDE)DIST_DIR)/bin
	cd src/jetstream && rm -f jetstream jetstream.exe jetstream.darwin
	rm -rf node_modules src/frontend/packages/*/node_modules
endef

$(call register_always, clean, release)
$(call register, clean, dist, $(_HIDE)clean.release)

$(call declare_verb_default, clean, $(_HIDE)clean.release)

# ── Dump (introspection) ─────────────────────────────────────
# dump.version recipe is defined in version.mk (shared library)
$(call register, dump, version)

define dump.actions
	@echo "Registered verb+modifier pairs:"
	@for pair in $($(_HIDE)REGISTRY); do \
		verb=$${pair%%.*}; mod=$${pair#*.}; \
		printf "  make %-12s %s\n" "$$verb" "$$mod"; \
	done
endef
$(call register, dump, actions)

$(call declare_verb, dump)

# ── Development ports ─────────────────────────────────────────
BACKEND_PORT  ?= 5443
FRONTEND_PORT ?= 5440

# ── Simple verbs (no modifiers) ──────────────────────────────
.PHONY: stage install lint

stage:
	@chmod +x build/install-local.sh
	@./build/install-local.sh

install:
	@echo "Installing dependencies..."
	bun install
	@echo "Dependencies installed."

# lint: standalone verb, but no-op when used as check modifier
ifeq ($(filter check,$(MAKECMDGOALS)),)
lint:
	$(check.lint)
else
lint: ;@:
endif

# ── Bump (version management) ─────────────────────────────────
# bump uses its own modifier set not shared with other verbs,
# so it is wired manually rather than via register/declare_verb.

$(_HIDE)BUMP_MOD := $(filter major minor patch dev alpha beta rc prerelease,$(MAKECMDGOALS))

.PHONY: bump
bump:
	@set -- $($(_HIDE)BUMP_MOD); \
	if [ $$# -eq 0 ]; then \
		echo "Usage: make bump <major|minor|patch|dev|alpha|beta|rc|prerelease>" >&2; \
		exit 1; \
	elif [ $$# -gt 1 ]; then \
		echo "Only one bump modifier allowed" >&2; \
		exit 1; \
	fi
	@chmod +x build/version-bump.sh
	@./build/version-bump.sh bump $($(_HIDE)BUMP_MOD) $(if $(filter yes,$(DRYRUN)),--dry-run)

# ── Help ──────────────────────────────────────────────────────
.PHONY: help
help:
	@echo "Stratos Build System ($($(_HIDE)SEMVER_VERSION) | $($(_HIDE)CURRENT_PLATFORM))"
	@echo ""
	@echo "Building:"
	@echo "  make build                Build frontend + all backend platforms"
	@echo "  make build frontend       Build frontend only"
	@echo "  make build backend        Cross-compile all backend platforms"
	@echo "  make build backend PLATFORM=linux/amd64  Build single platform"
	@echo "  make build korifi         Static cgo backend for Korifi (linux/host-arch)"
	@echo ""
	@echo "Testing:"
	@echo "  make test                 Run all tests"
	@echo "  make test frontend        Frontend tests only"
	@echo "  make test frontend PROJECT=core SCOPE=<path>  Narrowed vitest run"
	@echo "  make test backend         Backend tests only"
	@echo "  make test e2e             Run Playwright E2E tests"
	@echo "  make e2e clean            Sweep stratos-e2e-test labeled CF resources"
	@echo "  make lint                 Run linters"
	@echo ""
	@echo "Quality:"
	@echo "  make check                Run all quality gates (lint + gate)"
	@echo "  make check lint           Lint checks only"
	@echo "  make check gate           Lint + unit tests (gate-check)"
	@echo "  make check tests          Unit tests only"
	@echo "  make check coverage       Unit tests with coverage"
	@echo "  make check e2e            Playwright E2E core tests"
	@echo ""
	@echo "Release:"
	@echo "  make release              Create CF zip + GitHub archives"
	@echo "  make release cf           CF-pushable zip only"
	@echo "  make release korifi       Korifi-pushable zip (Paketo procfile manifest)"
	@echo "  make release github       GitHub release archives only"
	@echo ""
	@echo "Deploy (documentation website):"
	@echo "  make deploy website pages Push preview to your fork's GitHub Pages"
	@echo "  make deploy website cf    cf push built website to current CF target"
	@echo "  make build deploy website cf  Build website, then cf push it"
	@echo ""
	@echo "Setup:"
	@echo "  make install              Install dependencies (bun install)"
	@echo "  make stage                Stage production build for local testing"
	@echo ""
	@echo "Clean:"
	@echo "  make clean                Remove all build output"
	@echo "  make clean frontend       Remove frontend build only"
	@echo "  make clean backend        Remove backend binaries only"
	@echo "  make clean dist           Remove everything (including node_modules)"
	@echo ""
	@echo "Security & dependencies:"
	@echo "  make audit                Run default security scanners"
	@echo "  make audit frontend       bun audit (npm advisory DB)"
	@echo "  make audit backend        gosec + trivy + govulncheck (both Go modules)"
	@echo "  make audit actions        zizmor (ZIZMOR_FLAGS=\"--persona=auditor\" for strict)"
	@echo "  make audit packages       osv-scanner (all lockfiles + go.mods)"
	@echo "  make audit secrets        gitleaks (working-tree secret scan)"
	@echo "  make audit tests          gosec incl. test files + #nosec suppressions"
	@echo "  make audit tree           trivy full-tree scan (deploy/, helm, manifests)"
	@echo "  make audit history        gitleaks full git-history scan (slow)"
	@echo "  make audit licenses       osv-scanner dependency license report"
	@echo "  make audit summary        High/moderate/low counts only"
	@echo "  make outdated             List outdated direct deps (frontend + backend)"
	@echo "  make outdated frontend    bun outdated"
	@echo "  make outdated backend     go list -m -u all"
	@echo "  make deps dependabot      List open dependency PRs (gh)"
	@echo ""
	@echo "Other:"
	@echo "  make stamp frontend       Generate build-info.ts with version metadata"
	@echo "  make dump version         Print version and build metadata"
	@echo ""
	@echo "Development:"
	@echo "  make dev frontend         Start frontend dev server (port $(FRONTEND_PORT))"
	@echo "  make dev backend          Start backend dev server (port $(BACKEND_PORT))"
	@echo "  make dev website          Start documentation site dev server"
	@echo "  make build website        Build the documentation website"
	@echo "  make build booklets       Render docs booklets (epub/PDF, needs quarto)"
	@echo "  Override ports:  make dev backend BACKEND_PORT=5543"
	@echo "                   make dev frontend FRONTEND_PORT=5540 BACKEND_PORT=5543"
	@echo ""
	@echo "Version:"
	@echo "  make bump major           Next major release (v5.0.0)"
	@echo "  make bump minor           Next minor release (v4.10.0)"
	@echo "  make bump patch           Next patch release (v4.9.4)"
	@echo "  make bump dev             Increment dev prerelease (dev.N)"
	@echo "  make bump alpha           Set/increment alpha prerelease (alpha.N)"
	@echo "  make bump beta            Set/increment beta prerelease (beta.N)"
	@echo "  make bump rc              Set/increment rc prerelease (rc.N)"
	@echo "  make bump prerelease      Set/increment prerelease (prerelease.N)"
	@echo ""
	@echo "Variables:"
	@echo "  FINAL=strip               Strip prerelease from version (persisted)"
	@echo "  DRYRUN=yes                Preview actions without executing"
	@echo "  VERSION=vX.Y.Z            Override version"
	@echo "  PLATFORM=os/arch          Override target platform"
	@echo ""
	@echo "  Examples:"
	@echo "    make release cf FINAL=strip       Finalize version + package"
	@echo "    make bump dev DRYRUN=yes          Preview version bump"
	@echo ""
	@echo "Registry:"
	@echo "  make dump actions         List all registered verb+modifier pairs"
	@if [ -f site.mk ]; then $(MAKE) --no-print-directory $(_HIDE)site-help 2>/dev/null || (echo "" && echo "Site-specific targets available (see site.mk)"); fi

# ── Deprecated target shims ──────────────────────────────────
include deprecated.mk

# ── Site-specific overrides ──────────────────────────────────
$(_HIDE)SITE := site
# $(wildcard) so make 3.81 (macOS) stays silent when the file is absent —
# bare -include still prints a spurious "No rule to make target" there.
-include $(wildcard $($(_HIDE)SITE).mk)
