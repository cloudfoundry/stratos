#!/usr/bin/env bash
# Test harness for release-notes.sh (new-fragment numbering + assembly)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RN="${SCRIPT_DIR}/release-notes.sh"

PASS=0
FAIL=0
TMPDIR=$(mktemp -d)
trap 'rm -rf "${TMPDIR}"' EXIT

export FRAG_DIR="${TMPDIR}/changelog.d"
mkdir -p "${FRAG_DIR}"

check() {
  local label=$1 expected=$2 actual=$3
  if [[ "${actual}" == "${expected}" ]]; then
    PASS=$((PASS + 1))
    echo "  ✓ ${label}"
  else
    FAIL=$((FAIL + 1))
    echo "  ✗ ${label}: expected '${expected}', got '${actual}'"
  fi
}

check_fails() {
  local label=$1
  shift
  if "$@" >/dev/null 2>&1; then
    FAIL=$((FAIL + 1))
    echo "  ✗ ${label}: expected failure, succeeded"
  else
    PASS=$((PASS + 1))
    echo "  ✓ ${label}"
  fi
}

echo "new:"
check "first fragment is 0001" "${FRAG_DIR}/0001-first.md" "$(bash "${RN}" new first)"
printf '[Chores]\n- later chore\n' > "${FRAG_DIR}/0007-later.md"
check "next = highest existing + 1" "${FRAG_DIR}/0008-second.md" "$(bash "${RN}" new second)"
check "slug is sanitized" "${FRAG_DIR}/0009-feat-my-branch.md" "$(bash "${RN}" new 'Feat/My_Branch')"
rm "${FRAG_DIR}"/*.md

echo "assemble:"
check "no fragments → empty output" "" "$(bash "${RN}" assemble)"

printf '[Features]\n- feature A\n\n[BugFixes]\n- fix A\n' > "${FRAG_DIR}/0001-a.md"
printf '[Features]\n- feature B\n' > "${FRAG_DIR}/0002-b.md"
printf '[Breaking Changes]\n- breaks X\n' > "${FRAG_DIR}/0003-c.md"
expected='[Breaking Changes]
- breaks X

[Features]
- feature A
- feature B

[BugFixes]
- fix A'
check "grouped, canonical order, populated sections only" "${expected}" "$(bash "${RN}" assemble)"

printf '[Nope]\n- bad section\n' > "${FRAG_DIR}/0004-bad.md"
check_fails "unknown section fails assembly" bash "${RN}" assemble
rm "${FRAG_DIR}/0004-bad.md"

printf 'stray line before any header\n' > "${FRAG_DIR}/0005-stray.md"
check_fails "content before a section header fails" bash "${RN}" assemble
rm "${FRAG_DIR}/0005-stray.md"

echo ""
echo "${PASS} passed, ${FAIL} failed"
exit $((FAIL > 0 ? 1 : 0))
