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
rm "${FRAG_DIR}"/*.md

# deps/check read git history, so they need a repo of their own rather than
# the checkout this harness runs in.
echo "deps:"
export ROOT_DIR="${TMPDIR}/repo"
mkdir -p "${ROOT_DIR}"
git -C "${ROOT_DIR}" init -q
git -C "${ROOT_DIR}" -c user.email=t@t -c user.name=t commit -q --allow-empty -m 'feat: base'
git -C "${ROOT_DIR}" tag v1.0.0
for msg in 'chore(deps): bump left from 1 to 2' \
           'feat: unrelated work' \
           'chore(deps-dev): bump right from 3 to 4' \
           'chore(deps): bump left from 1 to 2'; do
  git -C "${ROOT_DIR}" -c user.email=t@t -c user.name=t commit -q --allow-empty -m "${msg}"
done

check "no fragment yet → check warns" "1" \
  "$(bash "${RN}" check 2>&1 >/dev/null | grep -c '^WARNING')"

frag=$(bash "${RN}" deps 2>/dev/null)
check "deps fragment is named for the slug" "${FRAG_DIR}/0001-dependency-updates.md" "${frag}"
check "bumps deduped, prefix stripped, non-deps commits ignored" \
  "[Chores]
- Dependency updates: left from 1 to 2; right from 3 to 4." "$(cat "${frag}")"
check "drafted fragment silences check" "" "$(bash "${RN}" check 2>&1 >/dev/null)"
# The draft is meant to be rewritten; prose that drops the raw subjects must
# still count as covered, or every well-curated release warns.
check "hand-written prose still counts as covered" "" \
  "$(printf '[Chores]\n- Routine dependency updates (#1, #2).\n' > "${frag}"
     bash "${RN}" check 2>&1 >/dev/null)"
check "unrelated fragment does not count as covered" "1" \
  "$(printf '[Features]\n- a feature\n' > "${frag}"
     bash "${RN}" check 2>&1 >/dev/null | grep -c '^WARNING')"
rm "${frag}"
check "check exits 0 even when warning" "0" \
  "$(bash "${RN}" check >/dev/null 2>&1; echo $?)"
# Runnable between releases to answer "has enough piled up to cut a build?"
check "count reported on stdout regardless of coverage" \
  "changelog.d: 2 dependency bump(s) in v1.0.0..HEAD" "$(bash "${RN}" check 2>/dev/null)"

git -C "${ROOT_DIR}" tag v1.1.0
check "window starts at the newest tag" \
  "changelog.d: no dependency bumps in v1.1.0..HEAD — nothing to draft" \
  "$(bash "${RN}" deps 2>/dev/null)"
check "explicit since overrides the tag" "${FRAG_DIR}/0001-dependency-updates.md" \
  "$(bash "${RN}" deps v1.0.0 2>/dev/null)"

echo ""
echo "${PASS} passed, ${FAIL} failed"
exit $((FAIL > 0 ? 1 : 0))
