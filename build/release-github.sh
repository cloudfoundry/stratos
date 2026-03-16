#!/usr/bin/env bash
# Package Stratos release archives
# Creates 7 archives: 6 platform binaries + 1 source archive

set -euo pipefail

VERSION=${1:-$(node -p "require('./package.json').version")}

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Directories
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
BIN_DIR="${DIST_DIR}/bin"
RELEASE_DIR="${DIST_DIR}/release"

# Platform configurations
PLATFORMS=(
  "linux:amd64"
  "linux:arm64"
  "darwin:amd64"
  "darwin:arm64"
  "windows:amd64"
  "windows:arm64"
)

log() {
  echo -e "${BLUE}[package]${NC} $1"
}

success() {
  echo -e "${GREEN}[package]${NC} $1"
}

error() {
  echo -e "${RED}[package]${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}[package]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  log "Checking prerequisites..."

  # Check frontend build
  if [ ! -d "${DIST_DIR}/frontend/browser" ] && [ ! -d "${DIST_DIR}/frontend/stratos" ]; then
    error "Frontend not built. Run: make build frontend"
  fi

  # Check backend binaries
  if [ ! -d "${BIN_DIR}" ]; then
    error "Backend binaries not found. Run: make build backend-all"
  fi

  local missing_binaries=()
  for platform in "${PLATFORMS[@]}"; do
    local os="${platform%:*}"
    local arch="${platform#*:}"
    local binary="jetstream-${os}-${arch}"
    [ "$os" = "windows" ] && binary="${binary}.exe"

    if [ ! -f "${BIN_DIR}/${binary}" ]; then
      missing_binaries+=("${binary}")
    fi
  done

  if [ ${#missing_binaries[@]} -gt 0 ]; then
    error "Missing binaries: ${missing_binaries[*]}. Run: make build backend-all"
  fi

  success "Prerequisites OK"
}

# Create release directory
prepare_release_dir() {
  log "Preparing release directory..."
  mkdir -p "${RELEASE_DIR}"
  rm -rf "${RELEASE_DIR:?}"/*
  success "Release directory ready: ${RELEASE_DIR}"
}

# Package platform-specific archive
package_platform() {
  local os=$1
  local arch=$2

  log "Packaging ${os}-${arch}..."

  local binary="jetstream-${os}-${arch}"
  local ext=""
  local archive_ext="tar.gz"

  if [ "$os" = "windows" ]; then
    binary="${binary}.exe"
    ext=".exe"
    archive_ext="zip"
  fi

  # Create temporary staging directory
  local tmpdir=$(mktemp -d)
  local stagedir="${tmpdir}/stratos-${VERSION}-${os}-${arch}"

  mkdir -p "${stagedir}"/{bin,ui,config,deploy}

  # Copy backend binary
  cp "${BIN_DIR}/${binary}" "${stagedir}/bin/jetstream${ext}"
  chmod +x "${stagedir}/bin/jetstream${ext}"

  # Copy frontend build
  if [ -d "${DIST_DIR}/frontend/browser" ]; then
    cp -r "${DIST_DIR}/frontend/browser"/* "${stagedir}/ui/" 2>/dev/null || true
  elif [ -d "${DIST_DIR}/frontend/stratos" ]; then
    cp -r "${DIST_DIR}/frontend/stratos"/* "${stagedir}/ui/" 2>/dev/null || true
  fi

  # Copy configuration
  if [ -f "${ROOT_DIR}/src/jetstream/config.example" ]; then
    cp "${ROOT_DIR}/src/jetstream/config.example" "${stagedir}/config/"
  fi

  # Copy deployment files
  if [ -d "${ROOT_DIR}/deploy/containers" ]; then
    cp -r "${ROOT_DIR}/deploy/containers" "${stagedir}/deploy/" 2>/dev/null || true
  fi
  if [ -d "${ROOT_DIR}/deploy/kubernetes" ]; then
    cp -r "${ROOT_DIR}/deploy/kubernetes" "${stagedir}/deploy/" 2>/dev/null || true
  fi

  # Copy docs
  for file in LICENSE README.md CHANGELOG.md; do
    if [ -f "${ROOT_DIR}/${file}" ]; then
      cp "${ROOT_DIR}/${file}" "${stagedir}/"
    fi
  done

  # Create VERSION file
  echo "${VERSION#v}" > "${stagedir}/VERSION"

  # Create README for release
  cat > "${stagedir}/README.txt" << EOF
Stratos ${VERSION} - ${os}-${arch}

Quick Start:
1. Extract this archive
2. Configure: edit config/config.example and save as config/config.properties
3. Run: ./bin/jetstream${ext}
4. Visit: https://localhost:5443

Documentation: https://github.com/cloudfoundry/stratos
Support: https://github.com/cloudfoundry/stratos/issues
EOF

  # Create archive
  cd "${tmpdir}"
  if [ "$os" = "windows" ]; then
    zip -r "${RELEASE_DIR}/stratos-${VERSION}-${os}-${arch}.zip" "stratos-${VERSION}-${os}-${arch}" > /dev/null
    success "Created stratos-${VERSION}-${os}-${arch}.zip"
  else
    tar czf "${RELEASE_DIR}/stratos-${VERSION}-${os}-${arch}.tar.gz" "stratos-${VERSION}-${os}-${arch}"
    success "Created stratos-${VERSION}-${os}-${arch}.tar.gz"
  fi

  # Cleanup
  rm -rf "${tmpdir}"
}

# Package source archive
package_source() {
  log "Packaging source archive..."

  cd "${ROOT_DIR}"

  # Use git archive if in a git repo
  if git rev-parse --git-dir > /dev/null 2>&1; then
    git archive --format=tar --prefix="stratos-${VERSION}-src/" HEAD | gzip > "${RELEASE_DIR}/stratos-${VERSION}-src.tar.gz"
    success "Created stratos-${VERSION}-src.tar.gz (via git archive)"
  else
    # Fallback: create tar manually
    local tmpdir=$(mktemp -d)
    local stagedir="${tmpdir}/stratos-${VERSION}-src"

    mkdir -p "${stagedir}"

    # Copy source files (exclude build artifacts and dependencies)
    rsync -a \
      --exclude='node_modules' \
      --exclude='dist' \
      --exclude='dist-devkit' \
      --exclude='.angular' \
      --exclude='coverage' \
      --exclude='*.log' \
      --exclude='.git' \
      "${ROOT_DIR}/" "${stagedir}/"

    cd "${tmpdir}"
    tar czf "${RELEASE_DIR}/stratos-${VERSION}-src.tar.gz" "stratos-${VERSION}-src"
    rm -rf "${tmpdir}"

    success "Created stratos-${VERSION}-src.tar.gz (via rsync)"
  fi
}

# Main packaging function
main() {
  echo ""
  log "═══════════════════════════════════════════════════════════"
  log "  Stratos Release Packaging"
  log "  Version: ${VERSION}"
  log "═══════════════════════════════════════════════════════════"
  echo ""

  check_prerequisites
  prepare_release_dir

  # Package platform binaries
  for platform in "${PLATFORMS[@]}"; do
    local os="${platform%:*}"
    local arch="${platform#*:}"
    package_platform "$os" "$arch"
  done

  # Package source
  package_source

  echo ""
  success "═══════════════════════════════════════════════════════════"
  success "  Packaging Complete!"
  success "═══════════════════════════════════════════════════════════"
  echo ""
  log "Release archives created in: ${RELEASE_DIR}"
  echo ""
  ls -lh "${RELEASE_DIR}"
  echo ""

  # Count archives
  local archive_count=$(ls -1 "${RELEASE_DIR}" | wc -l | tr -d ' ')
  success "Total: ${archive_count} archives (6 platform + 1 source)"
  echo ""
}

# Run main function
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
