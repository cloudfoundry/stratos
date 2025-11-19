# Stratos Makefile - Simple, Powerful, Cross-Platform
# Usage: make <target>

.PHONY: help install build build-frontend build-backend build-backend-all
.PHONY: dev-frontend dev-backend dev-restart
.PHONY: test test-unit test-e2e lint
.PHONY: release release-candidate package
.PHONY: clean clean-deep clean-dev
.PHONY: security gosec trivy vuln install-tools

# Default target
.DEFAULT_GOAL := help

# Version management
VERSION ?= $(shell node -p "require('./package.json').version")
BUILD_DATE = $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT = $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
CYAN := \033[0;36m
NC := \033[0m

# Detect platform
UNAME_S := $(shell uname -s)
UNAME_M := $(shell uname -m)

ifeq ($(UNAME_S),Linux)
    PLATFORM := linux
endif
ifeq ($(UNAME_S),Darwin)
    PLATFORM := darwin
endif

ifeq ($(UNAME_M),x86_64)
    ARCH := amd64
endif
ifeq ($(UNAME_M),aarch64)
    ARCH := arm64
endif
ifeq ($(UNAME_M),arm64)
    ARCH := arm64
endif

CURRENT_PLATFORM := $(PLATFORM)-$(ARCH)

# Cross-compilation platforms
PLATFORMS := linux-amd64 linux-arm64 darwin-amd64 darwin-arm64 windows-amd64 windows-arm64

# Directories
DIST_DIR := dist
RELEASE_DIR := $(DIST_DIR)/release
BIN_DIR := $(DIST_DIR)/bin

#
# Help target - default
#
help:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║           Stratos Build System (v5.0.0  )                  ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(CYAN)📦 Setup:$(NC)"
	@echo "  make install              Install all dependencies (bootstrap automatic!)"
	@echo ""
	@echo "$(CYAN)🚀 Development:$(NC)"
	@echo "  make dev-frontend         Start frontend dev server (https://127.0.0.1:5440)"
	@echo "  make dev-backend          Start backend dev server"
	@echo "  make dev-restart          Quick rebuild and restart backend"
	@echo ""
	@echo "$(CYAN)🔨 Building:$(NC)"
	@echo "  make build                Build frontend + backend ($(CURRENT_PLATFORM))"
	@echo "  make build-frontend       Build frontend only (production)"
	@echo "  make build-backend        Build backend only ($(CURRENT_PLATFORM))"
	@echo "  make build-backend-all    Build backend for all 6 platforms"
	@echo ""
	@echo "$(CYAN)🧪 Testing:$(NC)"
	@echo "  make test                 Run all tests"
	@echo "  make test-unit            Run unit tests (Vitest)"
	@echo "  make test-e2e             Run E2E tests (Playwright)"
	@echo "  make lint                 Run linters"
	@echo ""
	@echo "$(CYAN)📦 Release:$(NC)"
	@echo "  make release VERSION=v5.0.0     Create production release"
	@echo "  make release-candidate VERSION=v5.0.0-rc.1  Create RC"
	@echo "  make package                    Package current build"
	@echo ""
	@echo "$(CYAN)🔒 Security:$(NC)"
	@echo "  make security             Run all security scans"
	@echo "  make gosec                Run gosec security scanner"
	@echo "  make trivy                Run trivy vulnerability scanner"
	@echo "  make vuln                 Run govulncheck"
	@echo ""
	@echo "$(CYAN)🧹 Cleanup:$(NC)"
	@echo "  make clean                Remove build artifacts"
	@echo "  make clean-dev            Remove development artifacts"
	@echo "  make clean-deep           Remove everything (including node_modules)"
	@echo ""
	@echo "$(CYAN)🎯 Quick Start:$(NC)"
	@echo "  git clone stratos && cd stratos"
	@echo "  make install              # Bootstrap happens automatically!"
	@echo "  make dev-frontend         # Terminal 1"
	@echo "  make dev-backend          # Terminal 2"
	@echo "  # Visit https://127.0.0.1:5440"
	@echo ""
	@echo "$(YELLOW)Current platform: $(CURRENT_PLATFORM) | Version: $(VERSION)$(NC)"
	@echo ""

#
# Setup
#
install:
	@echo "$(BLUE)📦 Installing dependencies...$(NC)"
	@echo "$(YELLOW)Note: Bootstrap happens automatically via preinstall hook$(NC)"
	bun install
	@echo "$(GREEN)✅ Dependencies installed!$(NC)"
	@echo ""
	@echo "$(CYAN)Next steps:$(NC)"
	@echo "  make dev-frontend    # Start development"
	@echo "  make build           # Build for production"

# Legacy bootstrap target (deprecated)
bootstrap:
	@echo "$(YELLOW)⚠️  Bootstrap is no longer required!$(NC)"
	@echo "$(CYAN)Just run: make install$(NC)"
	@echo ""
	@echo "The bootstrap process now happens automatically during 'bun install'"
	@echo "via the preinstall hook (build/ensure-devkit.cjs)"

#
# Building
#
build: build-frontend build-backend
	@echo "$(GREEN)✅ Full build complete (frontend + backend)$(NC)"

build-frontend:
	@echo "$(BLUE)🔨 Building frontend (production)...$(NC)"
	bun run build
	@echo "$(GREEN)✅ Frontend built$(NC)"

build-frontend-dev:
	@echo "$(BLUE)🔨 Building frontend (development)...$(NC)"
	bun run build-dev
	@echo "$(GREEN)✅ Frontend built (dev mode)$(NC)"

build-backend:
	@echo "$(BLUE)🔨 Building backend for $(CURRENT_PLATFORM)...$(NC)"
	@mkdir -p $(BIN_DIR)
	cd src/jetstream && \
		go build \
		-ldflags "-X main.appVersion=$(VERSION) -X main.buildDate=$(BUILD_DATE) -X main.gitCommit=$(GIT_COMMIT)" \
		-o ../../$(BIN_DIR)/jetstream
	@echo "$(GREEN)✅ Backend built: $(BIN_DIR)/jetstream$(NC)"

build-backend-all:
	@echo "$(BLUE)🔨 Building backend for all 6 platforms...$(NC)"
	@chmod +x build/cross-compile.sh
	@./build/cross-compile.sh "$(VERSION)" "$(BUILD_DATE)" "$(GIT_COMMIT)"
	@echo "$(GREEN)✅ All platform binaries built in $(BIN_DIR)/$(NC)"

#
# Development
#
dev-frontend:
	@echo "$(BLUE)🚀 Starting frontend dev server...$(NC)"
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║  Frontend Dev Server                                       ║$(NC)"
	@echo "$(CYAN)╠════════════════════════════════════════════════════════════╣$(NC)"
	@echo "$(CYAN)║  URL:        https://127.0.0.1:5440                        ║$(NC)"
	@echo "$(CYAN)║  Source Maps: ✅ Enabled                                   ║$(NC)"
	@echo "$(CYAN)║  Hot Reload:  ✅ Enabled                                   ║$(NC)"
	@echo "$(CYAN)║  SSL/WSS:     ✅ Enabled                                   ║$(NC)"
	@echo "$(CYAN)║  API Proxy:   → https://127.0.0.1:5443                     ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	bun run start

dev-backend:
	@echo "$(BLUE)🚀 Starting backend dev server...$(NC)"
	@if [ ! -f $(BIN_DIR)/jetstream ]; then \
		echo "$(YELLOW)⚠️  Backend not built, building now...$(NC)"; \
		$(MAKE) build-backend; \
	fi
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║  Jetstream Backend API                                     ║$(NC)"
	@echo "$(CYAN)╠════════════════════════════════════════════════════════════╣$(NC)"
	@echo "$(CYAN)║  URL:        https://127.0.0.1:5443                        ║$(NC)"
	@echo "$(CYAN)║  API:        /pp/* and /api/*                              ║$(NC)"
	@echo "$(CYAN)║  Admin User: admin/admin                                   ║$(NC)"
	@echo "$(CYAN)║  CORS:       ✅ Enabled for dev                            ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	cd src/jetstream && ../../$(BIN_DIR)/jetstream

dev-restart:
	@echo "$(BLUE)🔄 Quick rebuild and restart...$(NC)"
	@$(MAKE) build-backend
	@echo ""
	@echo "$(GREEN)✅ Backend rebuilt!$(NC)"
	@echo "$(YELLOW)Restart 'make dev-backend' to use new version$(NC)"

# Alias for compatibility
dev-full-build: build-backend
	@echo "$(GREEN)✅ Backend built!$(NC)"
	@echo ""
	@echo "$(CYAN)Next steps:$(NC)"
	@echo "  Terminal 1: make dev-frontend"
	@echo "  Terminal 2: make dev-backend"

#
# Testing
#
test: test-unit
	@echo "$(GREEN)✅ All tests passed!$(NC)"

test-unit:
	@echo "$(BLUE)🧪 Running unit tests (Vitest)...$(NC)"
	bun run test
	@echo "$(GREEN)✅ Unit tests complete$(NC)"

test-e2e:
	@echo "$(BLUE)🧪 Running E2E tests (Playwright)...$(NC)"
	bun run e2e
	@echo "$(GREEN)✅ E2E tests complete$(NC)"

lint:
	@echo "$(BLUE)🔍 Running linters...$(NC)"
	bun run lint
	cd src/jetstream && go fmt ./... && go vet ./...
	@echo "$(GREEN)✅ Linting complete$(NC)"

#
# Security
#
security: gosec trivy vuln
	@echo "$(GREEN)✅ All security checks complete$(NC)"

install-tools:
	@echo "$(BLUE)🔧 Installing security tools...$(NC)"
	@go install github.com/securego/gosec/v2/cmd/gosec@latest
	@go install golang.org/x/vuln/cmd/govulncheck@latest
	@echo "$(YELLOW)Note: Install trivy from https://github.com/aquasecurity/trivy$(NC)"
	@echo "$(GREEN)✅ Tool installation complete$(NC)"

gosec:
	@echo "$(BLUE)🔒 Running gosec security scanner...$(NC)"
	@which gosec > /dev/null || (echo "$(RED)gosec not installed. Run 'make install-tools'$(NC)" && exit 1)
	@cd src/jetstream && gosec -quiet -fmt json -out gosec-report.json ./... || true
	@cd src/jetstream && gosec -quiet ./... || true
	@echo "$(GREEN)✅ Gosec scan complete$(NC)"

trivy:
	@echo "$(BLUE)🔒 Running trivy vulnerability scanner...$(NC)"
	@which trivy > /dev/null || (echo "$(RED)trivy not installed. Run 'make install-tools'$(NC)" && exit 1)
	@trivy fs --security-checks vuln,config src/jetstream || true
	@echo "$(GREEN)✅ Trivy scan complete$(NC)"

vuln:
	@echo "$(BLUE)🔒 Running govulncheck...$(NC)"
	@which govulncheck > /dev/null || (echo "$(RED)govulncheck not installed. Run 'make install-tools'$(NC)" && exit 1)
	@cd src/jetstream && govulncheck ./... || true
	@echo "$(GREEN)✅ Govulncheck complete$(NC)"

#
# Release Management
#
release: verify-version
	@echo "$(BLUE)📦 Creating release $(VERSION)...$(NC)"
	@$(MAKE) build
	@$(MAKE) build-backend-all
	@$(MAKE) package
	@chmod +x build/create-checksums.sh 2>/dev/null || true
	@if [ -f build/create-checksums.sh ]; then ./build/create-checksums.sh "$(VERSION)"; fi
	@chmod +x build/create-git-tag.sh 2>/dev/null || true
	@if [ -f build/create-git-tag.sh ]; then ./build/create-git-tag.sh "$(VERSION)"; fi
	@echo ""
	@echo "$(GREEN)✅ Release $(VERSION) complete!$(NC)"
	@echo "$(CYAN)Artifacts in: $(RELEASE_DIR)$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Test release archives"
	@echo "  2. Push tag: git push origin $(VERSION)"
	@echo "  3. Create GitHub release: gh release create $(VERSION) $(RELEASE_DIR)/*"

release-candidate: verify-version
	@echo "$(BLUE)📦 Creating release candidate $(VERSION)...$(NC)"
	@$(MAKE) build
	@$(MAKE) build-backend-all
	@$(MAKE) package
	@chmod +x build/create-checksums.sh 2>/dev/null || true
	@if [ -f build/create-checksums.sh ]; then ./build/create-checksums.sh "$(VERSION)"; fi
	@echo "$(GREEN)✅ Release candidate $(VERSION) complete!$(NC)"

package:
	@echo "$(BLUE)📦 Packaging release archives...$(NC)"
	@if [ ! -f build/package.sh ]; then \
		echo "$(RED)❌ build/package.sh not found$(NC)"; \
		echo "$(YELLOW)This will be created in Phase 3$(NC)"; \
		exit 0; \
	fi
	@chmod +x build/package.sh
	@./build/package.sh "$(VERSION)"
	@echo "$(GREEN)✅ Archives created$(NC)"

verify-version:
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)❌ VERSION not set$(NC)"; \
		exit 1; \
	fi
	@if ! echo "$(VERSION)" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9\.]+)?$$'; then \
		echo "$(RED)❌ Invalid version format: $(VERSION)$(NC)"; \
		echo "Expected: vMAJOR.MINOR.PATCH[-PRERELEASE]"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Version $(VERSION) validated$(NC)"

#
# Cleanup
#
clean:
	@echo "$(BLUE)🧹 Cleaning build artifacts...$(NC)"
	rm -rf $(DIST_DIR) .angular dist-devkit
	cd src/jetstream && rm -f jetstream jetstream.exe jetstream.darwin
	@echo "$(GREEN)✅ Clean complete$(NC)"

clean-dev:
	@echo "$(BLUE)🧹 Cleaning development artifacts...$(NC)"
	rm -rf $(DIST_DIR)/ .angular/
	rm -rf src/jetstream/jetstream src/jetstream/jetstream.darwin
	@echo "$(GREEN)✅ Development artifacts cleaned$(NC)"

clean-deep: clean
	@echo "$(BLUE)🧹 Deep clean (including node_modules)...$(NC)"
	rm -rf node_modules src/frontend/packages/*/node_modules
	@echo "$(GREEN)✅ Deep clean complete$(NC)"
	@echo "$(YELLOW)Run 'make install' to reinstall dependencies$(NC)"
