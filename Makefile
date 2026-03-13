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
#   make release                Release all targets (cf + github)
#   make release cf             CF-pushable zip
#   make release github         GitHub release archives
#   make install                Stage for local testing
#   make debug-version          Print resolved version variables
#
# See docs/build-and-packaging.md for full documentation.

include version.mk

# ── Directories ───────────────────────────────────────────────
DIST_DIR    := dist
RELEASE_DIR := $(DIST_DIR)/release
BIN_DIR     := $(DIST_DIR)/bin

# ── Platform detection ────────────────────────────────────────
UNAME_S := $(shell uname -s)
UNAME_M := $(shell uname -m)

ifeq ($(UNAME_S),Linux)
  PLATFORM := linux
else ifeq ($(UNAME_S),Darwin)
  PLATFORM := darwin
else
  PLATFORM := $(UNAME_S)
endif

ifeq ($(UNAME_M),x86_64)
  ARCH := amd64
else ifeq ($(UNAME_M),aarch64)
  ARCH := arm64
else ifeq ($(UNAME_M),arm64)
  ARCH := arm64
else
  ARCH := $(UNAME_M)
endif

CURRENT_PLATFORM := $(PLATFORM)-$(ARCH)

# ── Component selection ───────────────────────────────────────
WANT_FRONTEND :=
WANT_BACKEND  :=
WANT_BE_ALL   :=

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
ifneq ($(filter all,$(MAKECMDGOALS)),)
  WANT_FRONTEND := yes
  WANT_BACKEND  := yes
  WANT_BE_ALL   := yes
endif

# Default: frontend + backend when none specified
ifeq ($(WANT_FRONTEND)$(WANT_BACKEND),)
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

# No-op targets so modifiers don't error
.PHONY: frontend backend backend-all all cf github
frontend backend backend-all all cf github:
	@:

# Dispatch helpers
FE = $(if $(WANT_FRONTEND),$1)
BE = $(if $(WANT_BACKEND),$(if $(WANT_BE_ALL),$2,$1))
CF = $(if $(WANT_CF),$1)
GH = $(if $(WANT_GITHUB),$1)

# ── Build targets ─────────────────────────────────────────────
.PHONY: build fe-build be-build be-build-all
build: $(call FE,fe-build) $(call BE,be-build,be-build-all)

fe-build:
	@echo "Building frontend (production)..."
	bun run build
	@echo "Frontend built: $(DIST_DIR)/frontend/browser/"

be-build:
	@echo "Building backend for $(CURRENT_PLATFORM)..."
	@mkdir -p $(BIN_DIR)
	cd src/jetstream && go build -ldflags "$(GO_LDFLAGS)" -o ../../$(BIN_DIR)/jetstream
	@echo "Backend built: $(BIN_DIR)/jetstream"

be-build-all:
	@echo "Cross-compiling backend for all platforms..."
	@chmod +x build/cross-compile.sh
	./build/cross-compile.sh "$(SEMVER_VERSION)" "$(BUILD_DATE)" "$(BUILD_VCS_ID)"
	@echo "All platform binaries built: $(BIN_DIR)/"

# ── Test targets ──────────────────────────────────────────────
.PHONY: test fe-test be-test
test: $(call FE,fe-test) $(call BE,be-test,be-test)

fe-test:
	@echo "Running frontend tests..."
	bun run test

be-test:
	@echo "Running backend tests..."
	cd src/jetstream && go test ./... -v -count=1

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
.PHONY: dev dev-fe dev-be dev-restart
dev: $(call FE,dev-fe) $(call BE,dev-be,dev-be)

dev-fe:
	bun run start

dev-be:
	@if [ ! -f $(BIN_DIR)/jetstream ]; then \
		echo "Backend not built, building now..."; \
		$(MAKE) build backend; \
	fi
	cd src/jetstream && ../../$(BIN_DIR)/jetstream

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

# ── Cleanup ───────────────────────────────────────────────────
.PHONY: clean clean-dev clean-deep
clean:
	rm -rf $(DIST_DIR) .angular dist-devkit
	cd src/jetstream && rm -f jetstream jetstream.exe jetstream.darwin

clean-dev: clean

clean-deep: clean
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
	@echo "Other:"
	@echo "  make clean                Remove build artifacts"
	@echo "  make clean-deep           Remove everything (including node_modules)"
	@echo "  make security             Run security scans"
	@echo "  make debug-version        Print version and build metadata"
	@echo ""
	@echo "Development:"
	@echo "  make dev frontend         Start frontend dev server"
	@echo "  make dev backend          Start backend dev server"
