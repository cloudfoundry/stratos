#!/usr/bin/env bash
# Tests for build/version-bump.sh
# Run from repo root: bash test/test-version-bump.sh

set -euo pipefail

SCRIPT="./build/version-bump.sh"
PASS=0
FAIL=0

assert_version() {
  local desc="$1"
  local input="$2"
  local cmd="$3"
  local expected="$4"

  local tmp
  tmp=$(mktemp -d)
  echo "{\"version\":\"${input}\"}" > "${tmp}/package.json"

  local got
  got=$(PACKAGE_JSON="${tmp}/package.json" bash "${SCRIPT}" ${cmd} --dry-run 2>&1 || true)
  rm -rf "${tmp}"

  if [ "${got}" = "${expected}" ]; then
    echo "  PASS: ${desc}"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: ${desc}"
    echo "        input:    ${input}"
    echo "        cmd:      ${cmd}"
    echo "        expected: ${expected}"
    echo "        got:      ${got}"
    FAIL=$((FAIL + 1))
  fi
}

echo "version-bump.sh tests"
echo "─────────────────────"

# Existing: major/minor/patch strip prerelease and bump the component
assert_version "bump patch from prerelease"    "v4.9.3-dev.38"  "bump patch"  "v4.9.4"
assert_version "bump minor from prerelease"    "v4.9.3-dev.38"  "bump minor"  "v4.10.0"
assert_version "bump major from prerelease"    "v4.9.3-dev.38"  "bump major"  "v5.0.0"
assert_version "bump patch from clean"         "v4.9.3"         "bump patch"  "v4.9.4"

# New: dev prerelease
assert_version "bump dev increments counter"   "v4.9.3-dev.38"  "bump dev"    "v4.9.3-dev.39"
assert_version "bump dev creates dev.1"        "v4.9.3"         "bump dev"    "v4.9.3-dev.1"
assert_version "bump dev resets from rc"       "v4.9.3-rc.2"    "bump dev"    "v4.9.3-dev.1"

# New: rc prerelease
assert_version "bump rc creates rc.1"          "v4.9.3"         "bump rc"     "v4.9.3-rc.1"
assert_version "bump rc increments counter"    "v4.9.3-rc.1"    "bump rc"     "v4.9.3-rc.2"
assert_version "bump rc resets from dev"       "v4.9.3-dev.38"  "bump rc"     "v4.9.3-rc.1"

echo "─────────────────────"
echo "Results: ${PASS} passed, ${FAIL} failed"
[ "${FAIL}" -eq 0 ]
