#!/usr/bin/env bash
# Test harness for version-bump.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUMP="${SCRIPT_DIR}/version-bump.sh"

PASS=0
FAIL=0
TMPDIR=$(mktemp -d)
trap 'rm -rf "${TMPDIR}"' EXIT

# Create a fake package.json with a given version
setup() {
  local version=$1
  export PACKAGE_JSON="${TMPDIR}/package.json"
  echo "{\"version\": \"${version}\"}" > "${PACKAGE_JSON}"
  # Create fake jetstream dir so VERSION file gets written
  mkdir -p "${TMPDIR}/src/jetstream"
}

# Get the version from the fake package.json
get_version() {
  jq -r '.version' "${PACKAGE_JSON}"
}

# Assert version equals expected
assert_version() {
  local label=$1
  local expected=$2
  local actual
  actual=$(get_version)
  # Strip build metadata for comparison if expected doesn't have it
  if [[ "${expected}" != *+* ]]; then
    actual="${actual%%+*}"
  fi
  if [[ "${actual}" == "${expected}" ]]; then
    PASS=$((PASS + 1))
    echo "  ✓ ${label}"
  else
    FAIL=$((FAIL + 1))
    echo "  ✗ ${label}: expected '${expected}', got '${actual}'"
  fi
}

# Assert version has build metadata matching pattern
assert_has_metadata() {
  local label=$1
  local actual
  actual=$(get_version)
  if [[ "${actual}" == *+build.*.* ]]; then
    PASS=$((PASS + 1))
    echo "  ✓ ${label}"
  else
    FAIL=$((FAIL + 1))
    echo "  ✗ ${label}: expected build metadata, got '${actual}'"
  fi
}

# Assert command fails
assert_fails() {
  local label=$1
  shift
  if "$@" >/dev/null 2>&1; then
    FAIL=$((FAIL + 1))
    echo "  ✗ ${label}: expected failure but succeeded"
  else
    PASS=$((PASS + 1))
    echo "  ✓ ${label}"
  fi
}

# Assert dry-run does not change file
assert_dry_run() {
  local label=$1
  shift
  local before
  before=$(get_version)
  "$@" --dry-run >/dev/null 2>&1
  local after
  after=$(get_version)
  if [[ "${before}" == "${after}" ]]; then
    PASS=$((PASS + 1))
    echo "  ✓ ${label}"
  else
    FAIL=$((FAIL + 1))
    echo "  ✗ ${label}: version changed from '${before}' to '${after}'"
  fi
}

echo "=== Existing prerelease stages ==="

echo "-- bump dev (increment) --"
setup "v4.9.3-dev.41"
bash "${BUMP}" bump dev || true
assert_version "dev.41 → dev.42" "v4.9.3-dev.42"
assert_has_metadata "dev bump has build metadata"

echo "-- bump dev (from clean) --"
setup "v4.9.3"
bash "${BUMP}" bump dev || true
assert_version "clean → dev.1" "v4.9.3-dev.1"

echo "-- bump rc (from dev) --"
setup "v4.9.3-dev.5"
bash "${BUMP}" bump rc || true
assert_version "dev.5 → rc.1" "v4.9.3-rc.1"

echo "-- bump rc (increment) --"
setup "v4.9.3-rc.1"
bash "${BUMP}" bump rc || true
assert_version "rc.1 → rc.2" "v4.9.3-rc.2"

echo ""
echo "=== New prerelease stages ==="

echo "-- bump alpha (from dev) --"
setup "v4.9.3-dev.5"
bash "${BUMP}" bump alpha || true
assert_version "dev.5 → alpha.1" "v4.9.3-alpha.1"

echo "-- bump alpha (increment) --"
setup "v4.9.3-alpha.1"
bash "${BUMP}" bump alpha || true
assert_version "alpha.1 → alpha.2" "v4.9.3-alpha.2"

echo "-- bump beta (from alpha) --"
setup "v4.9.3-alpha.3"
bash "${BUMP}" bump beta || true
assert_version "alpha.3 → beta.1" "v4.9.3-beta.1"

echo "-- bump beta (increment) --"
setup "v4.9.3-beta.1"
bash "${BUMP}" bump beta || true
assert_version "beta.1 → beta.2" "v4.9.3-beta.2"

echo "-- bump prerelease (from rc) --"
setup "v4.9.3-rc.2"
bash "${BUMP}" bump prerelease || true
assert_version "rc.2 → prerelease.1" "v4.9.3-prerelease.1"

echo "-- bump prerelease (increment) --"
setup "v4.9.3-prerelease.1"
bash "${BUMP}" bump prerelease || true
assert_version "prerelease.1 → prerelease.2" "v4.9.3-prerelease.2"

echo ""
echo "=== Release promotion ==="

echo "-- bump release (from prerelease) --"
setup "v4.9.3-prerelease.1"
bash "${BUMP}" bump release || true
assert_version "prerelease.1 → release" "v4.9.3"
assert_has_metadata "release has build metadata"

echo "-- bump release (from rc) --"
setup "v4.9.3-rc.2"
bash "${BUMP}" bump release || true
assert_version "rc.2 → release" "v4.9.3"

echo "-- bump release (from dev) --"
setup "v4.9.3-dev.5"
bash "${BUMP}" bump release || true
assert_version "dev.5 → release" "v4.9.3"

echo "-- bump release (already release — should fail) --"
setup "v4.9.3"
assert_fails "already release errors" bash "${BUMP}" bump release

echo ""
echo "=== Semver bumps with metadata ==="

echo "-- bump major (from prerelease) --"
setup "v4.9.3-rc.2"
bash "${BUMP}" bump major || true
assert_version "rc.2 → major" "v5.0.0"
assert_has_metadata "major has build metadata"

echo "-- bump minor --"
setup "v4.9.3-dev.5"
bash "${BUMP}" bump minor || true
assert_version "dev.5 → minor" "v4.10.0"

echo "-- bump patch --"
setup "v4.9.3-dev.5"
bash "${BUMP}" bump patch || true
assert_version "dev.5 → patch" "v4.9.4"

echo ""
echo "=== Build metadata ==="

echo "-- metadata format --"
setup "v4.9.3"
bash "${BUMP}" bump dev || true
actual=$(get_version)
if [[ "${actual}" =~ \+build\.[0-9]{8}\.[0-9a-f]{7,}$ ]]; then
  PASS=$((PASS + 1))
  echo "  ✓ metadata matches +build.YYYYMMDD.SHA format"
else
  FAIL=$((FAIL + 1))
  echo "  ✗ metadata format: got '${actual}'"
fi

echo ""
echo "=== Dry run ==="

echo "-- dry-run does not modify --"
setup "v4.9.3-dev.5"
assert_dry_run "dry-run unchanged" bash "${BUMP}" bump dev

echo ""
echo "=== Validation ==="

echo "-- validates version with metadata --"
if bash "${BUMP}" validate "v1.2.3-alpha.1+build.20260327.a1b2c3d" >/dev/null 2>&1; then
  PASS=$((PASS + 1))
  echo "  ✓ valid: v1.2.3-alpha.1+build.20260327.a1b2c3d"
else
  FAIL=$((FAIL + 1))
  echo "  ✗ validate failed: v1.2.3-alpha.1+build.20260327.a1b2c3d"
fi

echo "-- validates clean release with metadata --"
if bash "${BUMP}" validate "v1.2.3+build.20260327.a1b2c3d" >/dev/null 2>&1; then
  PASS=$((PASS + 1))
  echo "  ✓ valid: v1.2.3+build.20260327.a1b2c3d"
else
  FAIL=$((FAIL + 1))
  echo "  ✗ validate failed: v1.2.3+build.20260327.a1b2c3d"
fi

echo "-- rejects empty identifier --"
assert_fails "rejects +..foo" bash "${BUMP}" validate "v1.2.3+..foo"

echo ""
echo "==================================="
echo "Results: ${PASS} passed, ${FAIL} failed"
if [ "${FAIL}" -gt 0 ]; then
  exit 1
fi
