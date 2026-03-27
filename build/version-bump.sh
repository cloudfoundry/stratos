#!/usr/bin/env bash
# Version management script for Stratos

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# PACKAGE_JSON can be overridden for testing
PACKAGE_JSON="${PACKAGE_JSON:-${ROOT_DIR}/package.json}"

# ── Parse flags ───────────────────────────────────────────────
DRY_RUN=false
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) ARGS+=("$arg") ;;
  esac
done
set -- "${ARGS[@]+"${ARGS[@]}"}"

# ── Parse current version ─────────────────────────────────────
current_version=$(jq -r '.version' "${PACKAGE_JSON}")

usage() {
  cat <<EOF
Usage: $0 <command> [--dry-run]

Commands:
  bump <major|minor|patch>  Bump semver component (strips prerelease)
  bump dev                  Increment dev.N prerelease (creates dev.1 if none)
  bump rc                   Increment rc.N prerelease (creates rc.1 if none)
  set <version>             Set explicit version (vMAJOR.MINOR.PATCH[-PRE])
  show                      Show current version
  validate <version>        Validate version format

Flags:
  --dry-run                 Print new version without modifying files

Examples:
  $0 bump patch             # v4.9.3-dev.38 → v4.9.4
  $0 bump dev               # v4.9.3-dev.38 → v4.9.3-dev.39
  $0 bump rc                # v4.9.3-dev.38 → v4.9.3-rc.1
  $0 set v5.0.0-rc.1        # Set explicit version
  $0 bump patch --dry-run   # Preview without writing
EOF
  exit 1
}

validate_version() {
  local version=$1
  if [[ ! $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9\.]+)?$ ]]; then
    echo "Invalid version format: ${version}" >&2
    echo "Expected: vMAJOR.MINOR.PATCH[-PRERELEASE]" >&2
    exit 1
  fi
}

commit_version() {
  local new_version=$1
  validate_version "${new_version}"
  if [ "${DRY_RUN}" = true ]; then
    echo "${new_version}"
    return
  fi
  jq ".version = \"${new_version}\"" "${PACKAGE_JSON}" > "${PACKAGE_JSON}.tmp"
  mv "${PACKAGE_JSON}.tmp" "${PACKAGE_JSON}"

  # Update backend VERSION file if it exists or can be created
  local version_file
  version_file="$(dirname "${PACKAGE_JSON}")/src/jetstream/VERSION"
  if [ -d "$(dirname "${version_file}")" ]; then
    echo "${new_version#v}" > "${version_file}"
  fi

  echo "Version updated: ${current_version} → ${new_version}"
}

bump_semver() {
  local component=$1
  # Strip 'v' prefix and any prerelease suffix
  local base=${current_version#v}
  base=${base%%-*}
  IFS='.' read -r major minor patch <<< "${base}"
  case "${component}" in
    major) major=$((major + 1)); minor=0; patch=0 ;;
    minor) minor=$((minor + 1)); patch=0 ;;
    patch) patch=$((patch + 1)) ;;
    *)     echo "Invalid bump type: ${component}" >&2; usage ;;
  esac
  commit_version "v${major}.${minor}.${patch}"
}

bump_prerelease() {
  local kind=$1  # "dev" or "rc"
  # Extract base (semver core) and current prerelease
  local base=${current_version#v}
  local core=${base%%-*}
  local pre
  if [[ "${base}" == *-* ]]; then
    pre=${base#*-}
  else
    pre=""
  fi
  # If prerelease already matches the kind, increment counter; else start at 1
  local counter
  if [[ "${pre}" =~ ^${kind}\.([0-9]+)$ ]]; then
    counter=$((${BASH_REMATCH[1]} + 1))
  else
    counter=1
  fi
  commit_version "v${core}-${kind}.${counter}"
}

# ── Main ──────────────────────────────────────────────────────
case "${1:-}" in
  bump)
    case "${2:-}" in
      major|minor|patch) bump_semver "${2}" ;;
      dev|rc)            bump_prerelease "${2}" ;;
      *)  echo "Unknown bump type: '${2:-}'" >&2; usage ;;
    esac
    ;;
  set)
    commit_version "${2:-}"
    ;;
  show)
    echo "Current version: ${current_version}"
    ;;
  validate)
    validate_version "${2:-}"
    echo "Valid: ${2}"
    ;;
  *)
    usage
    ;;
esac
