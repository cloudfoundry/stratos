# Stratos Makefile — verb + target pattern
#
# Usage:
#   make build                  Build frontend + backend (current platform)
#   make build frontend         Build frontend only
#   make build backend          Build backend only (current platform)
#   make build backend-all      Cross-compile backend for 6 platforms
#   make build all              Frontend + cross-compile all backends
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
#   make clean all              Remove everything (including node_modules)
#   make dump version           Print resolved version variables
#
# See docs/build-and-packaging.md for full documentation.

include version.mk

# ── Directories ───────────────────────────────────────────────
DIST_DIR    := dist
RELEASE_DIR := $(DIST_DIR)/release
BIN_DIR     := $(DIST_DIR)/bin

# ── Platform detection ────────────────────────────────────────
# Override with: make build PLATFORM=linux/amd64
UNAME_S := $(shell uname -s)
UNAME_M := $(shell uname -m)

# Detect host OS
ifeq ($(UNAME_S),Linux)
  _HOST_OS := linux
else ifeq ($(UNAME_S),Darwin)
  _HOST_OS := darwin
else
  _HOST_OS := $(UNAME_S)
endif

# Detect host arch
ifeq ($(UNAME_M),x86_64)
  _HOST_ARCH := amd64
else ifeq ($(UNAME_M),aarch64)
  _HOST_ARCH := arm64
else ifeq ($(UNAME_M),arm64)
  _HOST_ARCH := arm64
else
  _HOST_ARCH := $(UNAME_M)
endif

# If PLATFORM is overridden (e.g., linux/amd64, linux-amd64, or linux_amd64), parse OS/ARCH
ifdef PLATFORM
  # Normalize separators: replace '/', '-', '_' with space, then take first two words
  _PLAT_WORDS := $(subst /, ,$(subst -, ,$(subst _, ,$(PLATFORM))))
  ifneq ($(word 2,$(_PLAT_WORDS)),)
    TARGET_OS   := $(word 1,$(_PLAT_WORDS))
    TARGET_ARCH := $(word 2,$(_PLAT_WORDS))
  else
    # Single word — just OS, use host arch
    TARGET_OS   := $(PLATFORM)
    TARGET_ARCH := $(_HOST_ARCH)
  endif
else
  TARGET_OS   := $(_HOST_OS)
  TARGET_ARCH := $(_HOST_ARCH)
endif

CURRENT_PLATFORM := $(TARGET_OS)/$(TARGET_ARCH)

# Cross-compilation: set GOOS/GOARCH when target differs from host
GO_ENV :=
ifneq ($(TARGET_OS),$(_HOST_OS))
  GO_ENV += GOOS=$(TARGET_OS)
endif
ifneq ($(TARGET_ARCH),$(_HOST_ARCH))
  GO_ENV += GOARCH=$(TARGET_ARCH)
endif

# ── Component selection ───────────────────────────────────────
WANT_FRONTEND :=
WANT_BACKEND  :=
WANT_BE_ALL   :=
WANT_E2E      :=

ifneq ($(filter frontend,$(MAKECMDGOALS)),)
  WANT_FRONTEND := yes
endif
ifneq ($(filter backend,$(MAKECMDGOALS)),)
  WANT_BACKEND := yes
endif
ifneq ($(filter backend-all,$(MAKECMDGOALS)),)
  WANT_BACKEND := yes
  WANT_BE_ALL  := yes
endif
ifneq ($(filter e2e,$(MAKECMDGOALS)),)
  WANT_E2E := yes
endif
ifneq ($(filter all,$(MAKECMDGOALS)),)
  WANT_FRONTEND := yes
  WANT_BACKEND  := yes
  WANT_BE_ALL   := yes
endif

# Default: frontend + backend when none specified (unless e2e)
ifeq ($(WANT_FRONTEND)$(WANT_BACKEND)$(WANT_E2E),)
  WANT_FRONTEND := yes
  WANT_BACKEND  := yes
endif

# ── Release target selection ──────────────────────────────────
WANT_CF     :=
WANT_GITHUB :=

ifneq ($(filter cf,$(MAKECMDGOALS)),)
  WANT_CF := yes
endif
ifneq ($(filter github,$(MAKECMDGOALS)),)
  WANT_GITHUB := yes
endif
ifeq ($(WANT_CF)$(WANT_GITHUB),)
  WANT_CF     := yes
  WANT_GITHUB := yes
endif

# When cf modifier is present, force linux/amd64 for build
ifeq ($(WANT_CF),yes)
  TARGET_OS   := linux
  TARGET_ARCH := amd64
  GO_ENV      := GOOS=linux GOARCH=amd64
  CURRENT_PLATFORM := linux/amd64
endif

# No-op targets so modifiers don't error
.PHONY: frontend backend backend-all all cf github dist version e2e
frontend backend backend-all all cf github dist version e2e:
	@:

# Dispatch helpers
FE = $(if $(WANT_FRONTEND),$1)
BE = $(if $(WANT_BACKEND),$(if $(WANT_BE_ALL),$2,$1))
CF = $(if $(WANT_CF),$1)
GH = $(if $(WANT_GITHUB),$1)

# ── Build targets ─────────────────────────────────────────────
.PHONY: build fe-build be-build be-build-all
build: $(call FE,fe-build) $(call BE,be-build,be-build-all)

fe-build: fe-version
	@echo "Building frontend (production)..."
	bun run build
	@echo "Frontend built: $(DIST_DIR)/frontend/browser/"

be-build:
	@echo "Building backend for $(CURRENT_PLATFORM)..."
	@mkdir -p $(BIN_DIR)
	cd src/jetstream && $(GO_ENV) go build -ldflags "$(GO_LDFLAGS)" -o ../../$(BIN_DIR)/jetstream
	@echo "Backend built: $(BIN_DIR)/jetstream"

be-build-all:
	@echo "Cross-compiling backend for all platforms..."
	@chmod +x build/cross-compile.sh
	./build/cross-compile.sh "$(SEMVER_VERSION)" "$(BUILD_DATE)" "$(BUILD_VCS_ID)"
	@echo "All platform binaries built: $(BIN_DIR)/"

# ── Test targets ──────────────────────────────────────────────
.PHONY: test fe-test be-test
test: $(call FE,fe-test) $(call BE,be-test,be-test) $(if $(WANT_E2E),fe-test-e2e)

fe-test:
	@echo "Running frontend tests..."
	bun run test

be-test:
	@echo "Running backend tests..."
	cd src/jetstream && go test ./... -v -count=1

# ── E2E test targets ─────────────────────────────────────────
.PHONY: fe-test-e2e
fe-test-e2e:
	@echo "Running Playwright E2E tests..."
	bun run e2e

# ── Release targets ───────────────────────────────────────────
.PHONY: release release-cf release-github
release: $(call CF,release-cf) $(call GH,release-github)

release-cf:
	@chmod +x build/release-cf.sh
	@./build/release-cf.sh "$(SEMVER_VERSION)"

release-github:
	@chmod +x build/release-github.sh
	@./build/release-github.sh "$(SEMVER_VERSION)"

# ── Install target ────────────────────────────────────────────
.PHONY: stage install-local
stage: install-local

install-local:
	@chmod +x build/install-local.sh
	@./build/install-local.sh

# ── Development ───────────────────────────────────────────────
BACKEND_PORT  ?= 5443
FRONTEND_PORT ?= 5440

.PHONY: dev dev-fe dev-be dev-restart
dev: $(call FE,dev-fe) $(call BE,dev-be,dev-be)

dev-fe:
	BACKEND_PORT=$(BACKEND_PORT) bun run ng serve --port $(FRONTEND_PORT) --proxy-config proxy.conf.cjs

dev-be:
	@if [ ! -f $(BIN_DIR)/jetstream ]; then \
		echo "Backend not built, building now..."; \
		$(MAKE) build backend; \
	fi
	cd src/jetstream && CONSOLE_PROXY_TLS_ADDRESS=:$(BACKEND_PORT) ../../$(BIN_DIR)/jetstream

dev-restart:
	@$(MAKE) build backend
	@echo "Backend rebuilt. Restart 'make dev backend' to use new version."

# Deprecation shims for old dev targets
.PHONY: dev-frontend dev-backend
dev-frontend:
	@echo "DEPRECATED: use 'make dev frontend' instead"
	@$(MAKE) dev frontend

dev-backend:
	@echo "DEPRECATED: use 'make dev backend' instead"
	@$(MAKE) dev backend

# ── Dependency setup ──────────────────────────────────────────
.PHONY: install
install:
	@echo "Installing dependencies..."
	bun install
	@echo "Dependencies installed."

# ── Lint ──────────────────────────────────────────────────────
.PHONY: lint
lint:
	bun run lint
	cd src/jetstream && go fmt ./... && go vet ./...

# ── Security ──────────────────────────────────────────────────
.PHONY: security gosec trivy vuln
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

# ── Clean selection ────────────────────────────────────────────
WANT_CLEAN_DIST :=
HAVE_EXPLICIT_TARGET :=

ifneq ($(filter frontend backend backend-all dist,$(MAKECMDGOALS)),)
  HAVE_EXPLICIT_TARGET := yes
endif
ifneq ($(filter dist all,$(MAKECMDGOALS)),)
  WANT_CLEAN_DIST := yes
endif

# ── Cleanup ───────────────────────────────────────────────────
.PHONY: clean clean-fe clean-be clean-release clean-dist
clean: $(call FE,clean-fe) $(call BE,clean-be,clean-be) $(if $(HAVE_EXPLICIT_TARGET),,clean-release) $(if $(WANT_CLEAN_DIST),clean-dist)

clean-fe:
	rm -rf $(DIST_DIR)/frontend .angular dist-devkit

clean-be:
	rm -rf $(DIST_DIR)/bin
	cd src/jetstream && rm -f jetstream jetstream.exe jetstream.darwin

clean-release:
	rm -rf $(DIST_DIR)/release $(DIST_DIR)/cf-package $(DIST_DIR)/install $(DIST_DIR)/stratos-cf-*.zip

clean-dist: clean-fe clean-be clean-release
	rm -rf node_modules src/frontend/packages/*/node_modules

# ── Deprecation helpers ───────────────────────────────────────
# Old hyphenated targets redirect to new verb+target pattern
.PHONY: build-frontend build-backend build-backend-all package
build-frontend:
	@echo "DEPRECATED: use 'make build frontend' instead"
	@$(MAKE) build frontend

build-backend:
	@echo "DEPRECATED: use 'make build backend' instead"
	@$(MAKE) build backend

build-backend-all:
	@echo "DEPRECATED: use 'make build backend-all' instead"
	@$(MAKE) build backend-all

package:
	@echo "DEPRECATED: use 'make release' instead"
	@$(MAKE) release

clean-dev:
	@echo "DEPRECATED: use 'make clean' instead"
	@$(MAKE) clean

clean-deep:
	@echo "DEPRECATED: use 'make clean all' instead"
	@$(MAKE) clean all

debug-version:
	@echo "DEPRECATED: use 'make dump version' instead"
	@$(MAKE) dump version

# ── Help ──────────────────────────────────────────────────────
.PHONY: help
help:
	@echo "Stratos Build System ($(SEMVER_VERSION) | $(CURRENT_PLATFORM))"
	@echo ""
	@echo "Building:"
	@echo "  make build                Build frontend + backend (current platform)"
	@echo "  make build frontend       Build frontend only"
	@echo "  make build backend        Build backend only (current platform)"
	@echo "  make build backend-all    Cross-compile backend for 6 platforms"
	@echo "  make build all            Frontend + cross-compile all backends"
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
	@echo "  make clean all            Remove everything (including node_modules)"
	@echo ""
	@echo "Other:"
	@echo "  make security             Run security scans"
	@echo "  make dump version         Print version and build metadata"
	@echo ""
	@echo "Development:"
	@echo "  make dev frontend         Start frontend dev server (port $(FRONTEND_PORT))"
	@echo "  make dev backend          Start backend dev server (port $(BACKEND_PORT))"
	@echo "  Override ports:  make dev backend BACKEND_PORT=5543"
	@echo "                   make dev frontend FRONTEND_PORT=5540 BACKEND_PORT=5543"
	@if [ -f site.mk ]; then $(MAKE) --no-print-directory site-help 2>/dev/null || (echo "" && echo "Site-specific targets available (see site.mk)"); fi

# ── Site-specific overrides ──────────────────────────────────
# site.mk is gitignored and loaded if present.
# See site.mk.example for the expected structure.
-include site.mk
