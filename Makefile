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
#   make stamp frontend         Generate build-info.ts with version metadata
#   make dump version           Print resolved version variables
#
# Debug: make _HIDE= <target>  — exposes all internal variables
#
# See docs/build-and-packaging.md for full documentation.

include version.mk

# ── Directories ───────────────────────────────────────────────
$(_HIDE)DIST_DIR    := dist
$(_HIDE)RELEASE_DIR := $($(_HIDE)DIST_DIR)/release
$(_HIDE)BIN_DIR     := $($(_HIDE)DIST_DIR)/bin

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

ifneq ($(filter frontend,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_FRONTEND := yes
endif
ifneq ($(filter backend,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_BACKEND := yes
endif
ifneq ($(filter e2e,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_E2E := yes
endif

# Default: frontend + backend when none specified (unless e2e),
# but only for verbs that use these modifiers (not clean/dump).
ifneq ($(filter build test dev stamp,$(MAKECMDGOALS)),)
ifeq ($($(_HIDE)WANT_FRONTEND)$($(_HIDE)WANT_BACKEND)$($(_HIDE)WANT_E2E),)
  $(_HIDE)WANT_FRONTEND := yes
  $(_HIDE)WANT_BACKEND  := yes
endif
endif

$(_HIDE)WANT_CF     :=
$(_HIDE)WANT_GITHUB :=

ifneq ($(filter cf,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_CF := yes
endif
ifneq ($(filter github,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_GITHUB := yes
endif
ifneq ($(filter release,$(MAKECMDGOALS)),)
ifeq ($($(_HIDE)WANT_CF)$($(_HIDE)WANT_GITHUB),)
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

$(_HIDE)WANT_CLEAN_DIST :=

ifneq ($(filter dist,$(MAKECMDGOALS)),)
  $(_HIDE)WANT_CLEAN_DIST := yes
endif

# No-op targets so modifiers don't error
.PHONY: frontend backend cf github dist version e2e actions
frontend backend cf github dist version e2e actions:
	@:

# No-op targets for bump modifiers (consumed by BUMP_MOD filter).
.PHONY: major minor patch rc alpha beta prerelease release
major minor patch rc alpha beta prerelease release:
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

define test.frontend
	@echo "Running frontend tests..."
	bun run test
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
$(call register, build, backend)

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
	cd src/jetstream && CONSOLE_PROXY_TLS_ADDRESS=:$(BACKEND_PORT) ../../$($(_HIDE)BIN_DIR)/jetstream
endef
$(call register, dev, backend)

# ── E2E ───────────────────────────────────────────────────────

define test.e2e
	@echo "Running Playwright E2E tests..."
	bun run e2e
endef
$(call register, test, e2e)

# ── CF release ────────────────────────────────────────────────

define release.cf
	@chmod +x build/release-cf.sh
	@./build/release-cf.sh "$($(_HIDE)SEMVER_VERSION)"
endef
$(call register, release, cf)

# ── GitHub release ────────────────────────────────────────────

define release.github
	@chmod +x build/release-github.sh
	@./build/release-github.sh "$($(_HIDE)SEMVER_VERSION)"
endef
$(call register, release, github)

# ══════════════════════════════════════════════════════════════
# Verb wiring — declare each verb after all objects are registered.
# ══════════════════════════════════════════════════════════════

# ── Cross-cutting modifier allowances ────────────────────────
# These modifiers affect build behavior through variables (e.g.,
# cf forces PLATFORM=linux/amd64) rather than via a registered recipe.
$(call allow, build, cf)

$(call declare_verb, build)
$(call declare_verb, test)
$(call declare_verb, release)
$(call declare_verb, stamp)
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

define clean.release
	rm -rf $($(_HIDE)DIST_DIR)/release $($(_HIDE)DIST_DIR)/cf-package $($(_HIDE)DIST_DIR)/install $($(_HIDE)DIST_DIR)/stratos-cf-*.zip
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
.PHONY: stage install lint security gosec trivy vuln

stage:
	@chmod +x build/install-local.sh
	@./build/install-local.sh

install:
	@echo "Installing dependencies..."
	bun install
	@echo "Dependencies installed."

lint:
	bun run lint
	cd src/jetstream && go fmt ./... && go vet ./...

security: gosec trivy vuln

gosec:
	@which gosec > /dev/null || (echo "gosec not installed. Run: go install github.com/securego/gosec/v2/cmd/gosec@latest" && exit 1)
	cd src/jetstream && gosec -quiet ./... || true

trivy:
	@which trivy > /dev/null || (echo "trivy not installed. See https://github.com/aquasecurity/trivy" && exit 1)
	trivy fs --security-checks vuln,config src/jetstream || true

vuln:
	@which govulncheck > /dev/null || (echo "govulncheck not installed. Run: go install golang.org/x/vuln/cmd/govulncheck@latest" && exit 1)
	cd src/jetstream && govulncheck ./... || true

# ── Bump (version management) ─────────────────────────────────
# bump uses its own modifier set not shared with other verbs,
# so it is wired manually rather than via register/declare_verb.

$(_HIDE)BUMP_MOD := $(filter major minor patch dev alpha beta rc prerelease release,$(MAKECMDGOALS))

.PHONY: bump
bump:
	@set -- $($(_HIDE)BUMP_MOD); \
	if [ $$# -eq 0 ]; then \
		echo "Usage: make bump <major|minor|patch|dev|alpha|beta|rc|prerelease|release>" >&2; \
		exit 1; \
	elif [ $$# -gt 1 ]; then \
		echo "Only one bump modifier allowed" >&2; \
		exit 1; \
	fi
	@chmod +x build/version-bump.sh
	@./build/version-bump.sh bump $($(_HIDE)BUMP_MOD)

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
	@echo ""
	@echo "Testing:"
	@echo "  make test                 Run all tests"
	@echo "  make test frontend        Frontend tests only"
	@echo "  make test backend         Backend tests only"
	@echo "  make test e2e             Run Playwright E2E tests"
	@echo "  make lint                 Run linters"
	@echo ""
	@echo "Release:"
	@echo "  make release              Create CF zip + GitHub archives"
	@echo "  make release cf           CF-pushable zip only"
	@echo "  make release github       GitHub release archives only"
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
	@echo "Other:"
	@echo "  make stamp frontend       Generate build-info.ts with version metadata"
	@echo "  make security             Run security scans"
	@echo "  make dump version         Print version and build metadata"
	@echo ""
	@echo "Development:"
	@echo "  make dev frontend         Start frontend dev server (port $(FRONTEND_PORT))"
	@echo "  make dev backend          Start backend dev server (port $(BACKEND_PORT))"
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
	@echo "  make bump release         Promote to release (strip prerelease)"
	@echo ""
	@echo "Registry:"
	@echo "  make dump actions         List all registered verb+modifier pairs"
	@if [ -f site.mk ]; then $(MAKE) --no-print-directory $(_HIDE)site-help 2>/dev/null || (echo "" && echo "Site-specific targets available (see site.mk)"); fi

# ── Deprecated target shims ──────────────────────────────────
include deprecated.mk

# ── Site-specific overrides ──────────────────────────────────
$(_HIDE)SITE := site
-include $($(_HIDE)SITE).mk
