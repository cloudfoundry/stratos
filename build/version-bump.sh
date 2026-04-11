#!/usr/bin/env bash
# Version management script for Stratos

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# PACKAGE_JSON can be overridden for testing
PACKAGE_JSON="${PACKAGE_JSON:-${ROOT_DIR}/package.json}"

# ── Build metadata ───────────────────────────────────────────
build_metadata() {
  local date_stamp sha_stamp
  date_stamp=$(date -u +%Y%m%d)
  sha_stamp=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  echo "+build.${date_stamp}.${sha_stamp}"
}

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
  bump <major|minor|patch>             Bump semver component (strips prerelease)
  bump <dev|alpha|beta|rc|prerelease>  Increment prerelease stage (creates .1 if new)
  set <version>                        Set explicit version
  show                                 Show current version
  validate <version>                   Validate version format

Note: To finalize a prerelease (strip the suffix) before packaging, use
'make release cf FINAL=strip' from the Make layer. This script's internal
'bump release' function exists only as an implementation detail of that
FINAL=strip path and is no longer a user-facing command.

Stages (lifecycle order):
  dev → alpha → beta → rc → prerelease → release

Flags:
  --dry-run                 Print new version without modifying files

Examples:
  $0 bump dev               # v4.9.3-dev.41 → v4.9.3-dev.42+build.YYYYMMDD.SHA
  $0 bump alpha             # v4.9.3-dev.42 → v4.9.3-alpha.1+build.YYYYMMDD.SHA
  $0 bump rc                # v4.9.3-beta.1 → v4.9.3-rc.1+build.YYYYMMDD.SHA
  $0 bump patch             # v4.9.3-rc.2   → v4.9.4+build.YYYYMMDD.SHA
  $0 set v5.0.0-rc.1        # Set explicit version
  $0 bump dev --dry-run     # Preview without writing
EOF
  exit 1
}

validate_version() {
  local version=$1
  if [[ ! $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?$ ]]; then
    echo "Invalid version format: ${version}" >&2
    echo "Expected: vMAJOR.MINOR.PATCH[-PRERELEASE][+BUILDMETA]" >&2
    exit 1
  fi
}

commit_version() {
  local new_version=$1
  # Append build metadata
  new_version="${new_version}$(build_metadata)"
  validate_version "${new_version}"
  if [ "${DRY_RUN}" = true ]; then
    echo "${new_version}"
    return
  fi
  jq --arg v "${new_version}" '.version = $v' "${PACKAGE_JSON}" > "${PACKAGE_JSON}.tmp"
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
  # Strip 'v' prefix, build metadata, then prerelease suffix
  local base=${current_version#v}
  base=${base%%+*}
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
  # Extract base (semver core) and current prerelease, stripping metadata
  local base=${current_version#v}
  base=${base%%+*}
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

bump_release() {
  # Strip 'v' prefix and build metadata
  local base=${current_version#v}
  base=${base%%+*}
  local core=${base%%-*}
  # Check if there's a prerelease to strip
  if [[ "${base}" == "${core}" ]]; then
    echo "Already a release version: ${current_version}" >&2
    echo "Nothing to promote." >&2
    exit 1
  fi
  commit_version "v${core}"
}

# ── Main ──────────────────────────────────────────────────────
case "${1:-}" in
  bump)
    case "${2:-}" in
      major|minor|patch)            bump_semver "${2}" ;;
      dev|alpha|beta|rc|prerelease) bump_prerelease "${2}" ;;
      release)                      bump_release ;;
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
    echo "Valid: ${2:-}"
    ;;
  *)
    usage
    ;;
esac
