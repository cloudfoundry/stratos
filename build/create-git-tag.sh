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

  # Create annotated tag. The tag body carries the release notes,
  # assembled from the changelog.d fragments — `make publish` consumes
  # it via --notes-from-tag.
  local commit=$(git rev-parse --short HEAD)
  local notes
  # Reported here, before the notes are frozen into the tag body, so the
  # author can still act on it. Warns, never blocks.
  "${ROOT_DIR}/build/release-notes.sh" check || true
  notes=$("${ROOT_DIR}/build/release-notes.sh" assemble)
  if [ -z "${notes}" ]; then
    warn "No changelog.d fragments — tag body falls back to a pointer line"
    notes="Release ${VERSION} — see CHANGELOG.md for details."
  fi

  log "Creating annotated tag ${VERSION} at commit ${commit}..."

  # Two -m flags, not one: git joins them with a blank line, which is what
  # separates a tag's subject from its body. With the notes as the only -m
  # the body has no blank line until the first section break, so git takes
  # the opening section header AND its first bullet as one subject —
  # `git tag -n` and GitHub's tag list then show a paragraph where a title
  # belongs. The subject is the release name; the notes stay the body.
  #
  # --cleanup=verbatim is load-bearing: the default strips lines beginning
  # with '#' as comments, and a markdown '## Section' heading is exactly
  # that. Without it every heading is silently deleted from the tag body —
  # the notes still publish, just with no sections at all.
  git tag -a "${VERSION}" --cleanup=verbatim -m "Stratos ${VERSION}" -m "${notes}"

  success "Tag ${VERSION} created"
  echo ""
  log "Next steps:"
  log "  1. Review tag: git show ${VERSION}"
  log "  2. Push tag:   git push origin ${VERSION}"
  log "  3. Create GitHub release: make publish TAG=${VERSION}"
  echo ""
}

# Run main function
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
