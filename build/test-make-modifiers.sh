#!/usr/bin/env bash
# Test harness for the Makefile's modifier warnings (check_mods in actions.mk).
# Dry runs only (make -n): nothing is built.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PASS=0
FAIL=0

warnings() {
  make -C "${ROOT}" -n "$@" 2>&1 | grep -E "WARNING:|COLLISION" || true
}

# A modifier the user did not type must not be reported, even when another
# verb on the same command line turned it on by default.
assert_quiet() {
  local out
  out=$(warnings "$@")
  if [ -z "${out}" ]; then
    echo "  PASS: make $* is quiet"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: make $* warned:"
    echo "${out}" | sed 's/^/        /'
    FAIL=$((FAIL + 1))
  fi
}

assert_warns() {
  local mod=$1 verb=$2
  shift 2
  if warnings "$@" | grep -q "'${mod}' is not a valid modifier for '${verb}'"; then
    echo "  PASS: make $* warns about ${mod} for ${verb}"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: make $* did not warn about ${mod} for ${verb}"
    FAIL=$((FAIL + 1))
  fi
}

echo "Modifier warnings"
assert_quiet build release cf
assert_quiet build cf
assert_quiet release cf
assert_quiet build frontend
assert_quiet dev frontend
assert_quiet stamp frontend
assert_warns frontend release release frontend
assert_warns cert build build cert

echo ""
echo "==================================="
echo "Results: ${PASS} passed, ${FAIL} failed"
if [ "${FAIL}" -gt 0 ]; then
  exit 1
fi
