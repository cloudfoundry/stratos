# Stratos Development Makefile
# Full stack development with source maps and hot reload

.PHONY: help build build-frontend build-backend dev-frontend dev-backend dev-full-build clean-dev

# Default target
.DEFAULT_GOAL := help

# Color definitions
BLUE   := \033[0;34m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
CYAN   := \033[0;36m
NC     := \033[0m # No Color

help:
	@echo "Stratos Development Commands:"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build           - Build both frontend and backend"
	@echo "  make build-frontend  - Build Angular frontend only"
	@echo "  make build-backend   - Build Jetstream backend only"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev-frontend    - Build and start Angular dev server (port 5000)"
	@echo "  make dev-backend     - Build and start Jetstream backend API server (port 5443)"
	@echo "  make dev-full-build  - Build backend, then start full stack development"
	@echo "  make clean-dev       - Clean development artifacts"
	@echo ""
	@echo "Full Stack Development Workflow:"
	@echo "  Terminal 1: make dev-frontend"
	@echo "  Terminal 2: make dev-backend"
	@echo "  Access at:  https://127.0.0.1:5440"
	@echo ""

.PHONY: install-tools
install-tools:
	@echo "$(BLUE)==> Installing development tools...$(NC)"
	@go install github.com/securego/gosec/v2/cmd/gosec@latest
	@go install golang.org/x/vuln/cmd/govulncheck@latest
	@echo "$(YELLOW)Note: Install trivy from https://github.com/aquasecurity/trivy$(NC)"
	@echo "$(GREEN)✓ Tool installation complete$(NC)"


# Build both frontend and backend
build: build-frontend build-backend
	@echo "✅ Full build complete (frontend + backend)"

# Build Angular frontend
build-frontend:
	@echo "Building Angular frontend..."
	bun run build

# Build Jetstream backend
build-backend:
	@echo "Building Jetstream backend..."
	bun run build-backend

# Start Angular dev server with source maps and hot reload
dev-frontend:
	@echo "Starting Angular dev server with source maps on https://127.0.0.1:5440"
	@echo "✅ Source maps enabled (real TypeScript line numbers)"
	@echo "✅ Hot reload enabled (instant updates on file save)"
	@echo "✅ SSL enabled (WebSocket support via wss://)"
	@echo "🔄 API requests will be proxied to Jetstream backend on :5443"
	@echo ""
	bun run start

# Start Jetstream backend API server
dev-backend:
	@echo "Starting Jetstream backend API server on https://127.0.0.1:5443"
	@echo "✅ CORS enabled for dev server (http://127.0.0.1:5440)"
	@echo "✅ API endpoints: /pp/* and /api/*"
	@echo "✅ Local admin user: admin/admin"
	@echo ""
	@if [ ! -f src/jetstream/jetstream ]; then \
		echo "⚠️  Backend binary not found. Building first..."; \
		$(MAKE) -s build-backend; \
	fi
	cd src/jetstream && ./jetstream

# Full build and start (for convenience)
dev-full-build: build-backend
	@echo "Backend built successfully!"
	@echo ""
	@echo "Next steps:"
	@echo "  Terminal 1: make dev-frontend"
	@echo "  Terminal 2: make dev-backend"
	@echo ""

.PHONY: security
security: gosec trivy vuln
	@echo "$(GREEN)✓ All security checks complete$(NC)"

.PHONY: gosec
gosec:
	@echo "$(BLUE)==> Running gosec security scanner...$(NC)"
	@which gosec > /dev/null || (echo "$(RED)gosec not installed. Run 'make install-tools'$(NC)" && exit 1)
	@cd src/jetstream && gosec -quiet -fmt json -out gosec-report.json ./... || true
	@cd src/jetstream && gosec -quiet ./... || true
	@echo "$(GREEN)✓ Gosec scan complete$(NC)"

.PHONY: trivy
trivy:
	@echo "$(BLUE)==> Running trivy vulnerability scanner...$(NC)"
	@which trivy > /dev/null || (echo "$(RED)trivy not installed. Run 'make install-tools'$(NC)" && exit 1)
	@trivy fs --security-checks vuln,config src/jetstream || true
	@echo "$(GREEN)✓ Trivy scan complete$(NC)"

.PHONY: vuln
vuln:
	@echo "$(BLUE)==> Running govulncheck vulnerability scanner...$(NC)"
	@which govulncheck > /dev/null || (echo "$(RED)govulncheck not installed. Run 'make install-tools'$(NC)" && exit 1)
	@cd src/jetstream && govulncheck ./... || true
	@echo "$(GREEN)✓ Govulncheck scan complete$(NC)"

# Clean development artifacts
clean-dev:
	@echo "Cleaning development artifacts..."
	rm -rf dist/
	rm -rf .angular/
	rm -rf src/jetstream/jetstream
	@echo "✅ Development artifacts cleaned"
