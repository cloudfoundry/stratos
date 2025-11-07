#!/usr/bin/env bash
# Create git tag for release

set -euo pipefail

VERSION=${1:-$(node -p "require('./package.json').version")}

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  echo -e "${BLUE}[git-tag]${NC} $1"
}

success() {
  echo -e "${GREEN}[git-tag]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[git-tag]${NC} $1"
}

error() {
  echo -e "${RED}[git-tag]${NC} $1"
  exit 1
}

# Main function
main() {
  cd "${ROOT_DIR}"

  log "Creating git tag for ${VERSION}..."

  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not a git repository"
  fi

  # Check if tag already exists
  if git rev-parse "${VERSION}" >/dev/null 2>&1; then
    warn "Tag ${VERSION} already exists"
    log "To replace it: git tag -d ${VERSION} && git push origin :${VERSION}"
    return 0
  fi

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warn "You have uncommitted changes"
    log "Continuing anyway (tag will point to last commit)"
  fi

  # Create annotated tag
  local commit=$(git rev-parse --short HEAD)
  local date=$(date -u +"%Y-%m-%d")

  log "Creating annotated tag ${VERSION} at commit ${commit}..."

  git tag -a "${VERSION}" -m "Release ${VERSION}

Release Date: ${date}
Commit: ${commit}

Archives:
- stratos-${VERSION}-linux-amd64.tar.gz
- stratos-${VERSION}-linux-arm64.tar.gz
- stratos-${VERSION}-darwin-amd64.tar.gz
- stratos-${VERSION}-darwin-arm64.tar.gz
- stratos-${VERSION}-windows-amd64.zip
- stratos-${VERSION}-windows-arm64.zip
- stratos-${VERSION}-src.tar.gz

See CHANGELOG.md for full release notes.
"

  success "Tag ${VERSION} created"
  echo ""
  log "Next steps:"
  log "  1. Review tag: git show ${VERSION}"
  log "  2. Push tag:   git push origin ${VERSION}"
  log "  3. Create GitHub release: gh release create ${VERSION} dist/release/*"
  echo ""
}

# Run main function
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
