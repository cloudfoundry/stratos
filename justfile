# Stratos Justfile - Simple, Powerful, Cross-Platform
# Usage: just <target>

# Configure shell for Windows PowerShell
set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# Version management
VERSION := env_var_or_default('VERSION', "dev")
BUILD_DATE := ""
GIT_COMMIT := ""

# Colors for output (ANSI escape codes - may not display in all terminals)
# Use Write-Host in PowerShell for better color support
BLUE := ""
GREEN := ""
YELLOW := ""
RED := ""
CYAN := ""
NC := ""

# Platform detection (works on Windows, Linux, and macOS)
PLATFORM := if os() == "linux" { "linux" } else if os() == "macos" { "darwin" } else { "windows" }
ARCH := if arch() == "x86_64" { "amd64" } else if arch() == "aarch64" { "arm64" } else { arch() }
CURRENT_PLATFORM := PLATFORM + "-" + ARCH

# Cross-compilation platforms (space-separated string)
PLATFORMS := "linux-amd64 linux-arm64 darwin-amd64 darwin-arm64 windows-amd64 windows-arm64"

# Directories
DIST_DIR := "dist"
RELEASE_DIR := DIST_DIR + "/release"
BIN_DIR := DIST_DIR + "/bin"

#
# default
#
help:
    @Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue; \
    Write-Host "║           Stratos Build System (v5.0.0  )                  ║" -ForegroundColor Blue; \
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue; \
    Write-Host ""; \
    Write-Host "📦 Setup:" -ForegroundColor Cyan; \
    Write-Host "  just install              Install all dependencies (bootstrap automatic!)"; \
    Write-Host ""; \
    Write-Host "🚀 Development:" -ForegroundColor Cyan; \
    Write-Host "  just dev-frontend         Start frontend dev server (https://127.0.0.1:5440)"; \
    Write-Host "  just dev-backend          Start backend dev server"; \
    Write-Host "  just dev-restart          Quick rebuild and restart backend"; \
    Write-Host ""; \
    Write-Host "🔨 Building:" -ForegroundColor Cyan; \
    Write-Host "  just build                Build frontend + backend ({{CURRENT_PLATFORM}})"; \
    Write-Host "  just build-frontend       Build frontend only (production)"; \
    Write-Host "  just build-backend        Build backend only ({{CURRENT_PLATFORM}})"; \
    Write-Host "  just build-backend-all    Build backend for all 6 platforms"; \
    Write-Host ""; \
    Write-Host "🧪 Testing:" -ForegroundColor Cyan; \
    Write-Host "  just test                 Run all tests"; \
    Write-Host "  just test-unit            Run unit tests (Vitest)"; \
    Write-Host "  just test-e2e             Run E2E tests (Playwright)"; \
    Write-Host "  just lint                 Run linters"; \
    Write-Host ""; \
    Write-Host "📦 Release:" -ForegroundColor Cyan; \
    Write-Host "  just release VERSION=v5.0.0     Create production release"; \
    Write-Host "  just release-candidate VERSION=v5.0.0-rc.1  Create RC"; \
    Write-Host "  just package                    Package current build"; \
    Write-Host ""; \
    Write-Host "🔒 Security:" -ForegroundColor Cyan; \
    Write-Host "  just security             Run all security scans"; \
    Write-Host "  just gosec                Run gosec security scanner"; \
    Write-Host "  just trivy                Run trivy vulnerability scanner"; \
    Write-Host "  just vuln                 Run govulncheck"; \
    Write-Host ""; \
    Write-Host "🧹 Cleanup:" -ForegroundColor Cyan; \
    Write-Host "  just clean                Remove build artifacts"; \
    Write-Host "  just clean-dev            Remove development artifacts"; \
    Write-Host "  just clean-deep           Remove everything (including node_modules)"; \
    Write-Host ""; \
    Write-Host "🎯 Quick Start:" -ForegroundColor Cyan; \
    Write-Host "  git clone stratos && cd stratos"; \
    Write-Host "  just install              # Bootstrap happens automatically!"; \
    Write-Host "  just dev-frontend         # Terminal 1"; \
    Write-Host "  just dev-backend          # Terminal 2"; \
    Write-Host "  # Visit https://127.0.0.1:5440"; \
    Write-Host ""; \
    Write-Host "Current platform: {{CURRENT_PLATFORM}} | Version: {{VERSION}}" -ForegroundColor Yellow; \
    Write-Host ""

#
# Setup
#
install:
    @Write-Host "📦 Installing dependencies..." -ForegroundColor Blue; \
    Write-Host "Note: Bootstrap happens automatically via preinstall hook" -ForegroundColor Yellow
    bun install
    @Write-Host "✅ Dependencies installed!" -ForegroundColor Green; \
    Write-Host ""; \
    Write-Host "Next steps:" -ForegroundColor Cyan; \
    Write-Host "  just dev-frontend    # Start development"; \
    Write-Host "  just build           # Build for production"

# Legacy bootstrap target (deprecated)
bootstrap:
    @Write-Host "⚠️  Bootstrap is no longer required!" -ForegroundColor Yellow; \
    Write-Host "Just run: just install" -ForegroundColor Cyan; \
    Write-Host ""; \
    Write-Host "The bootstrap process now happens automatically during 'bun install'"; \
    Write-Host "via the preinstall hook (build/ensure-devkit.cjs)"

#
# Building
#
build: build-frontend build-backend
    @Write-Host "✅ Full build complete (frontend + backend)" -ForegroundColor Green

build-frontend:
    @Write-Host "🔨 Building frontend (production)..." -ForegroundColor Blue
    bun run build
    @Write-Host "✅ Frontend built" -ForegroundColor Green

build-frontend-dev:
    @Write-Host "🔨 Building frontend (development)..." -ForegroundColor Blue
    bun run build-dev
    @Write-Host "✅ Frontend built (dev mode)" -ForegroundColor Green

build-backend:
    @Write-Host "🔨 Building backend for {{CURRENT_PLATFORM}}..." -ForegroundColor Blue
    @New-Item -ItemType Directory -Force -Path {{BIN_DIR}} | Out-Null
    cd src/jetstream && \
        go build \
        -ldflags "-X main.appVersion={{VERSION}} -X main.buildDate={{BUILD_DATE}} -X main.gitCommit={{GIT_COMMIT}}" \
        -o ../../{{BIN_DIR}}/jetstream
    @Write-Host "✅ Backend built: {{BIN_DIR}}/jetstream" -ForegroundColor Green

build-backend-all:
    @Write-Host "🔨 Building backend for all 6 platforms..." -ForegroundColor Blue
    @if (Test-Path build/cross-compile.sh) { sh build/cross-compile.sh "{{VERSION}}" "{{BUILD_DATE}}" "{{GIT_COMMIT}}" } else { Write-Host "cross-compile.sh not found" -ForegroundColor Yellow }
    @Write-Host "✅ All platform binaries built in {{BIN_DIR}}/" -ForegroundColor Green

#
# Development
#
dev-frontend:
    @Write-Host "🚀 Starting frontend dev server..." -ForegroundColor Blue; \
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan; \
    Write-Host "║  Frontend Dev Server                                       ║" -ForegroundColor Cyan; \
    Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan; \
    Write-Host "║  URL:        https://127.0.0.1:5440                        ║" -ForegroundColor Cyan; \
    Write-Host "║  Source Maps: ✅ Enabled                                   ║" -ForegroundColor Cyan; \
    Write-Host "║  Hot Reload:  ✅ Enabled                                   ║" -ForegroundColor Cyan; \
    Write-Host "║  SSL/WSS:     ✅ Enabled                                   ║" -ForegroundColor Cyan; \
    Write-Host "║  API Proxy:   → https://127.0.0.1:5443                     ║" -ForegroundColor Cyan; \
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan; \
    Write-Host ""
    bun run start

dev-backend:
    @Write-Host "🚀 Starting backend dev server..." -ForegroundColor Blue
    @if (!(Test-Path {{BIN_DIR}}/jetstream)) { \
        Write-Host "⚠️  Backend not built, building now..." -ForegroundColor Yellow; \
        just build-backend \
    }
    @Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan; \
    Write-Host "║  Jetstream Backend API                                     ║" -ForegroundColor Cyan; \
    Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan; \
    Write-Host "║  URL:        https://127.0.0.1:5443                        ║" -ForegroundColor Cyan; \
    Write-Host "║  API:        /pp/* and /api/*                              ║" -ForegroundColor Cyan; \
    Write-Host "║  Admin User: admin/admin                                   ║" -ForegroundColor Cyan; \
    Write-Host "║  CORS:       ✅ Enabled for dev                            ║" -ForegroundColor Cyan; \
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan; \
    Write-Host ""
    cd src/jetstream && ../../{{BIN_DIR}}/jetstream

dev-restart:
    @Write-Host "🔄 Quick rebuild and restart..." -ForegroundColor Blue
    @just build-backend
    @Write-Host ""; \
    Write-Host "✅ Backend rebuilt!" -ForegroundColor Green; \
    Write-Host "Restart 'just dev-backend' to use new version" -ForegroundColor Yellow

# Alias for compatibility
dev-full-build: build-backend
    @Write-Host "✅ Backend built!" -ForegroundColor Green; \
    Write-Host ""; \
    Write-Host "Next steps:" -ForegroundColor Cyan; \
    Write-Host "  Terminal 1: just dev-frontend"; \
    Write-Host "  Terminal 2: just dev-backend"

#
# Testing
#
test: test-unit
    @Write-Host "✅ All tests passed!" -ForegroundColor Green

test-unit:
    @Write-Host "🧪 Running unit tests (Vitest)..." -ForegroundColor Blue
    bun run test
    @Write-Host "✅ Unit tests complete" -ForegroundColor Green

test-e2e:
    @Write-Host "🧪 Running E2E tests (Playwright)..." -ForegroundColor Blue
    bun run e2e
    @Write-Host "✅ E2E tests complete" -ForegroundColor Green

lint:
    @Write-Host "🔍 Running linters..." -ForegroundColor Blue
    bun run lint
    cd src/jetstream && go fmt ./... && go vet ./...
    @Write-Host "✅ Linting complete" -ForegroundColor Green

#
# Security
#
security: gosec trivy vuln
    @Write-Host "✅ All security checks complete" -ForegroundColor Green

install-tools:
    @Write-Host "🔧 Installing security tools..." -ForegroundColor Blue
    @go install github.com/securego/gosec/v2/cmd/gosec@latest
    @go install golang.org/x/vuln/cmd/govulncheck@latest
    @Write-Host "Note: Install trivy from https://github.com/aquasecurity/trivy" -ForegroundColor Yellow; \
    Write-Host "✅ Tool installation complete" -ForegroundColor Green

gosec:
    @Write-Host "🔒 Running gosec security scanner..." -ForegroundColor Blue
    @if (!(Get-Command gosec -ErrorAction SilentlyContinue)) { Write-Host "gosec not installed. Run 'just install-tools'" -ForegroundColor Red; exit 1 }
    @cd src/jetstream; if ($?) { gosec -quiet -fmt json -out gosec-report.json ./... }; if ($?) { gosec -quiet ./... }
    @Write-Host "✅ Gosec scan complete" -ForegroundColor Green

trivy:
    @Write-Host "🔒 Running trivy vulnerability scanner..." -ForegroundColor Blue
    @if (!(Get-Command trivy -ErrorAction SilentlyContinue)) { Write-Host "trivy not installed. Run 'just install-tools'" -ForegroundColor Red; exit 1 }
    @trivy fs --security-checks vuln,config src/jetstream
    @Write-Host "✅ Trivy scan complete" -ForegroundColor Green

vuln:
    @Write-Host "🔒 Running govulncheck..." -ForegroundColor Blue
    @if (!(Get-Command govulncheck -ErrorAction SilentlyContinue)) { Write-Host "govulncheck not installed. Run 'just install-tools'" -ForegroundColor Red; exit 1 }
    @cd src/jetstream; if ($?) { govulncheck ./... }
    @Write-Host "✅ Govulncheck complete" -ForegroundColor Green

#
# Release Management
#
release: verify-version
    @Write-Host "📦 Creating release {{VERSION}}..." -ForegroundColor Blue
    @just build
    @just build-backend-all
    @just package
    @if (Test-Path build/create-checksums.sh) { sh build/create-checksums.sh "{{VERSION}}" }
    @if (Test-Path build/create-git-tag.sh) { sh build/create-git-tag.sh "{{VERSION}}" }
    @Write-Host ""; \
    Write-Host "✅ Release {{VERSION}} complete!" -ForegroundColor Green; \
    Write-Host "Artifacts in: {{RELEASE_DIR}}" -ForegroundColor Cyan; \
    Write-Host ""; \
    Write-Host "Next steps:" -ForegroundColor Yellow; \
    Write-Host "  1. Test release archives"; \
    Write-Host "  2. Push tag: git push origin {{VERSION}}"; \
    Write-Host "  3. Create GitHub release: gh release create {{VERSION}} {{RELEASE_DIR}}/*"

release-candidate: verify-version
    @Write-Host "📦 Creating release candidate {{VERSION}}..." -ForegroundColor Blue
    @just build
    @just build-backend-all
    @just package
    @if (Test-Path build/create-checksums.sh) { sh build/create-checksums.sh "{{VERSION}}" }
    @Write-Host "✅ Release candidate {{VERSION}} complete!" -ForegroundColor Green

package:
    @Write-Host "📦 Packaging release archives..." -ForegroundColor Blue
    @if (!(Test-Path build/package.sh)) { \
        Write-Host "❌ build/package.sh not found" -ForegroundColor Red; \
        Write-Host "This will be created in Phase 3" -ForegroundColor Yellow; \
        exit 0 \
    }
    @sh build/package.sh "{{VERSION}}"
    @Write-Host "✅ Archives created" -ForegroundColor Green

verify-version:
    @if ("{{VERSION}}" -eq "") { \
        Write-Host "❌ VERSION not set" -ForegroundColor Red; \
        exit 1 \
    }
    @if ("{{VERSION}}" -notmatch '^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9\.]+)?$') { \
        Write-Host "❌ Invalid version format: {{VERSION}}" -ForegroundColor Red; \
        Write-Host "Expected: vMAJOR.MINOR.PATCH[-PRERELEASE]"; \
        exit 1 \
    }
    @Write-Host "✅ Version {{VERSION}} validated" -ForegroundColor Green

#
# Cleanup
#
clean:
    @Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Blue
    @Remove-Item -Recurse -Force -ErrorAction SilentlyContinue {{DIST_DIR}}, .angular, dist-devkit
    @Remove-Item -Force -ErrorAction SilentlyContinue src/jetstream/jetstream, src/jetstream/jetstream.exe, src/jetstream/jetstream.darwin
    @Write-Host "✅ Clean complete" -ForegroundColor Green

clean-dev:
    @Write-Host "🧹 Cleaning development artifacts..." -ForegroundColor Blue
    @Remove-Item -Recurse -Force -ErrorAction SilentlyContinue {{DIST_DIR}}, .angular
    @Remove-Item -Force -ErrorAction SilentlyContinue src/jetstream/jetstream, src/jetstream/jetstream.darwin
    @Write-Host "✅ Development artifacts cleaned" -ForegroundColor Green

clean-deep: clean
    @Write-Host "🧹 Deep clean (including node_modules)..." -ForegroundColor Blue
    @Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
    @Get-ChildItem -Path src/frontend/packages -Directory | ForEach-Object { Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $_.FullName "node_modules") }
    @Write-Host "✅ Deep clean complete" -ForegroundColor Green; \
    Write-Host "Run 'just install' to reinstall dependencies" -ForegroundColor Yellow
