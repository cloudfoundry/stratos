#!/usr/bin/env bash
# Version management script for Stratos

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Parse current version
current_version=$(jq -r '.version' "${ROOT_DIR}/package.json")

usage() {
  cat <<EOF
Usage: $0 <command> [options]

Commands:
  bump <major|minor|patch>  - Bump version component
  set <version>             - Set explicit version
  show                      - Show current version
  validate <version>        - Validate version format

Examples:
  $0 bump minor             # v4.9.3 → v4.10.0
  $0 set v5.0.0-rc.1        # Set to release candidate
  $0 show                   # Display current version
EOF
  exit 1
}

show_version() {
  echo "Current version: ${current_version}"
}

validate_version() {
  local version=$1
  if [[ ! $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9\.]+)?$ ]]; then
    echo "❌ Invalid version format: ${version}"
    echo "Expected: vMAJOR.MINOR.PATCH[-PRERELEASE]"
    exit 1
  fi
  echo "✅ Valid version: ${version}"
}

set_version() {
  local new_version=$1
  validate_version "${new_version}"

  # Update package.json
  jq ".version = \"${new_version}\"" "${ROOT_DIR}/package.json" > "${ROOT_DIR}/package.json.tmp"
  mv "${ROOT_DIR}/package.json.tmp" "${ROOT_DIR}/package.json"

  # Update backend VERSION file if it exists
  if [ ! -f "${ROOT_DIR}/src/jetstream/VERSION" ]; then
    mkdir -p "${ROOT_DIR}/src/jetstream"
  fi
  echo "${new_version#v}" > "${ROOT_DIR}/src/jetstream/VERSION"

  echo "✅ Version updated: ${current_version} → ${new_version}"
  echo "Changed files:"
  echo "  - package.json"
  echo "  - src/jetstream/VERSION"
}

bump_version() {
  local component=$1

  # Strip 'v' prefix and prerelease suffix
  local base_version=${current_version#v}
  base_version=${base_version%%-*}

  IFS='.' read -r major minor patch <<< "${base_version}"

  case "${component}" in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo "❌ Invalid component: ${component}"
      usage
      ;;
  esac

  local new_version="v${major}.${minor}.${patch}"
  set_version "${new_version}"
}

# Main logic
case "${1:-}" in
  bump)
    bump_version "${2:-}"
    ;;
  set)
    set_version "${2:-}"
    ;;
  show)
    show_version
    ;;
  validate)
    validate_version "${2:-}"
    ;;
  *)
    usage
    ;;
esac
