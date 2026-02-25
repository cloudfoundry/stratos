#!/usr/bin/env bash
# Generate SHA256 checksums for release archives

set -euo pipefail

VERSION=${1:-$(node -p "require('./package.json').version")}

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Directories
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="${ROOT_DIR}/dist/release"

log() {
  echo -e "${BLUE}[checksums]${NC} $1"
}

success() {
  echo -e "${GREEN}[checksums]${NC} $1"
}

error() {
  echo -e "${RED}[checksums]${NC} $1"
  exit 1
}

# Main function
main() {
  log "Generating SHA256 checksums for ${VERSION}..."

  if [ ! -d "${RELEASE_DIR}" ]; then
    error "Release directory not found: ${RELEASE_DIR}"
  fi

  cd "${RELEASE_DIR}"

  # Check if we have any archives
  local archive_count=$(ls -1 *.tar.gz *.zip 2>/dev/null | wc -l | tr -d ' ')
  if [ "$archive_count" = "0" ]; then
    error "No archives found in ${RELEASE_DIR}"
  fi

  # Generate checksums
  log "Computing checksums for ${archive_count} archives..."

  # Create checksums file with header
  cat > SHA256SUMS << EOF
# SHA256 checksums for Stratos ${VERSION}
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
#
# Verify with: sha256sum -c SHA256SUMS
# Or on macOS: shasum -a 256 -c SHA256SUMS
#
EOF

  # Compute checksums (sorted alphabetically)
  if command -v sha256sum &> /dev/null; then
    sha256sum *.tar.gz *.zip 2>/dev/null | sort -k 2 >> SHA256SUMS
  elif command -v shasum &> /dev/null; then
    shasum -a 256 *.tar.gz *.zip 2>/dev/null | sort -k 2 >> SHA256SUMS
  else
    error "Neither sha256sum nor shasum found. Cannot generate checksums."
  fi

  success "Checksums generated: ${RELEASE_DIR}/SHA256SUMS"
  echo ""
  cat SHA256SUMS
  echo ""

  # Verify checksums
  log "Verifying checksums..."
  if command -v sha256sum &> /dev/null; then
    if sha256sum -c SHA256SUMS 2>&1 | grep -q "OK"; then
      success "All checksums verified successfully"
    fi
  elif command -v shasum &> /dev/null; then
    if shasum -a 256 -c SHA256SUMS 2>&1 | grep -q "OK"; then
      success "All checksums verified successfully"
    fi
  fi

  echo ""
}

# Run main function
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
