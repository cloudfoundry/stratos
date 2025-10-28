# Stratos Development Makefile
# Full stack development with source maps and hot reload

.PHONY: help build build-frontend build-backend dev-frontend dev-backend dev-full-build clean-dev

# Default target
.DEFAULT_GOAL := help

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
	@echo "  Access at:  http://127.0.0.1:5000"
	@echo ""

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
dev-frontend: build-frontend
	@echo "Starting Angular dev server with source maps on http://127.0.0.1:5000"
	@echo "✅ Source maps enabled (real TypeScript line numbers)"
	@echo "✅ Hot reload enabled (instant updates on file save)"
	@echo "🔄 API requests will be proxied to Jetstream backend on :5443"
	@echo ""
	bun run start-http

# Start Jetstream backend API server
dev-backend:
	@echo "Starting Jetstream backend API server on https://127.0.0.1:5443"
	@echo "✅ CORS enabled for dev server (http://127.0.0.1:4200)"
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

# Clean development artifacts
clean-dev:
	@echo "Cleaning development artifacts..."
	rm -rf dist/
	rm -rf .angular/
	rm -rf src/jetstream/jetstream
	@echo "✅ Development artifacts cleaned"
