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
# [Section] is authoring syntax; the output is markdown, so headings render
# as headings wherever the notes land. BugFixes is an identifier and is
# displayed as "Bug Fixes".
expected='## Breaking Changes

- breaks X

## Features

- feature A
- feature B

## Bug Fixes

- fix A'
check "grouped, canonical order, populated sections only" "${expected}" "$(bash "${RN}" assemble)"

printf '[Nope]\n- bad section\n' > "${FRAG_DIR}/0004-bad.md"
check_fails "unknown section fails assembly" bash "${RN}" assemble
rm "${FRAG_DIR}/0004-bad.md"

printf 'stray line before any header\n' > "${FRAG_DIR}/0005-stray.md"
check_fails "content before a section header fails" bash "${RN}" assemble
rm "${FRAG_DIR}"/*.md

# deps/check read git history, so they need a repo of their own rather than
# the checkout this harness runs in — and the fragments must live INSIDE it,
# because coverage is now judged by when a fragment was committed relative to
# the bumps. Commit dates are pinned so that ordering is deterministic rather
# than dependent on how fast the harness runs.
echo "deps:"
export ROOT_DIR="${TMPDIR}/repo"
export FRAG_DIR="${ROOT_DIR}/changelog.d"
mkdir -p "${FRAG_DIR}"
git -C "${ROOT_DIR}" init -q

repo_git() { git -C "${ROOT_DIR}" -c user.email=t@t -c user.name=t "$@"; }
at() {  # at <date> <git args...>
  local when=$1
  shift
  GIT_AUTHOR_DATE="${when}" GIT_COMMITTER_DATE="${when}" repo_git "$@"
}
commit_frag() {  # commit_frag <date> <message>
  repo_git add -A changelog.d
  at "$1" commit -q -m "$2"
}

at 2026-01-01T00:00:00 commit -q --allow-empty -m 'feat: base'
repo_git tag v1.0.0
day=1
for msg in 'chore(deps): bump left from 1 to 2' \
           'feat: unrelated work' \
           'chore(deps-dev): bump right from 3 to 4' \
           'chore(deps): bump left from 1 to 2'; do
  day=$((day + 1))
  at "2026-01-0${day}T00:00:00" commit -q --allow-empty -m "${msg}"
done

check "no fragment yet → check warns" "1" \
  "$(bash "${RN}" check 2>&1 >/dev/null | grep -c '^WARNING')"

frag=$(bash "${RN}" deps 2>/dev/null)
check "deps fragment is named for the slug" "${FRAG_DIR}/0001-dependency-updates.md" "${frag}"
check "bumps deduped, prefix stripped, non-deps commits ignored" \
  "[Chores]
- Dependency updates: left from 1 to 2; right from 3 to 4." "$(cat "${frag}")"
# A fragment git has no record of is being written right now.
check "uncommitted fragment counts as covered" "" "$(bash "${RN}" check 2>&1 >/dev/null)"
commit_frag 2026-01-10T00:00:00 'changelog: cover the bumps'
check "drafted fragment silences check" "" "$(bash "${RN}" check 2>&1 >/dev/null)"
# The draft is meant to be rewritten; prose that drops the raw subjects must
# still count as covered, or every well-curated release warns.
check "hand-written prose still counts as covered" "" \
  "$(printf '[Chores]\n- Routine dependency updates (#1, #2).\n' > "${frag}"
     commit_frag 2026-01-11T00:00:00 'changelog: rewrite into prose'
     bash "${RN}" check 2>&1 >/dev/null)"
check "unrelated fragment does not count as covered" "1" \
  "$(printf '[Features]\n- a feature\n' > "${frag}"
     commit_frag 2026-01-12T00:00:00 'changelog: unrelated'
     bash "${RN}" check 2>&1 >/dev/null | grep -c '^WARNING')"
check "check exits 0 even when warning" "0" \
  "$(bash "${RN}" check >/dev/null 2>&1; echo $?)"
# Runnable between releases to answer "has enough piled up to cut a build?"
check "count reported on stdout regardless of coverage" \
  "changelog.d: 2 dependency bump(s) in v1.0.0..HEAD" "$(bash "${RN}" check 2>/dev/null)"

# Coverage is time-ordered, not present/absent. An accurate fragment cannot
# describe a bump that merges after it — the #5718 case, where the fragment
# covering an earlier website bump silenced the report for a later one.
echo "check ordering:"
printf '[Chores]\n- Routine dependency updates (#1, #2).\n' > "${frag}"
commit_frag 2026-01-13T00:00:00 'changelog: cover the bumps again'
check "fragment newer than every bump is covered" "" \
  "$(bash "${RN}" check 2>&1 >/dev/null)"
at 2026-01-14T00:00:00 commit -q --allow-empty -m 'chore(deps): bump late from 5 to 6'
check "bump landing after the fragment warns" "1" \
  "$(bash "${RN}" check 2>&1 >/dev/null | grep -c '^WARNING')"
check "the warning says the fragment is behind, not missing" "1" \
  "$(bash "${RN}" check 2>&1 >/dev/null | grep -c 'landed after')"
printf '[Chores]\n- Routine dependency updates (#1, #2, #3).\n' > "${frag}"
commit_frag 2026-01-15T00:00:00 'changelog: cover the late bump'
check "re-touching the fragment re-covers it" "" \
  "$(bash "${RN}" check 2>&1 >/dev/null)"
# A fragment left over from an already-published window is older than every
# bump in the current one, so it no longer silences the report.
at 2026-01-16T00:00:00 commit -q --allow-empty -m 'chore(deps): bump newer from 7 to 8'
check "stale fragment from a past window does not cover" "1" \
  "$(bash "${RN}" check 2>&1 >/dev/null | grep -c '^WARNING')"
rm "${frag}"
commit_frag 2026-01-17T00:00:00 'changelog: sweep'

# Assembly order follows when a fragment LANDED, not its NNNN prefix. A
# contributor cannot know the merge order at authoring time, so a fragment
# numbered lower can legitimately land later.
echo "assemble ordering:"
printf '[Features]\n- numbered first, landed second.\n' > "${FRAG_DIR}/0010-early-number.md"
commit_frag 2026-02-02T00:00:00 'changelog: the low number, landing later'
printf '[Features]\n- numbered second, landed first.\n' > "${FRAG_DIR}/0020-late-number.md"
commit_frag 2026-02-01T00:00:00 'changelog: the high number, landing earlier'
check "bullets follow landing order, not filename order" \
  "## Features

- numbered second, landed first.
- numbered first, landed second." "$(bash "${RN}" assemble)"

# An unlanded fragment is the newest thing there is.
printf '[Features]\n- still being written.\n' > "${FRAG_DIR}/0005-uncommitted.md"
check "an uncommitted fragment sorts last" \
  "## Features

- numbered second, landed first.
- numbered first, landed second.
- still being written." "$(bash "${RN}" assemble)"
rm "${FRAG_DIR}/0005-uncommitted.md" "${FRAG_DIR}/0010-early-number.md" "${FRAG_DIR}/0020-late-number.md"
commit_frag 2026-02-03T00:00:00 'changelog: sweep the ordering fixtures'

echo "window:"
repo_git tag v1.1.0
check "window starts at the newest tag" \
  "changelog.d: no dependency bumps in v1.1.0..HEAD — nothing to draft" \
  "$(bash "${RN}" deps 2>/dev/null)"
check "explicit since overrides the tag" "${FRAG_DIR}/0001-dependency-updates.md" \
  "$(bash "${RN}" deps v1.0.0 2>/dev/null)"

# The tag body is where the notes are actually consumed — `make publish`
# reads it with %(contents:body), subject excluded. Two silent losses have happened here, both
# invisible in `release-notes.sh assemble` output and both caught only by
# looking at a real tag, so assert against one the script itself created.
echo "tag body:"
mkdir -p "${ROOT_DIR}/build"
cp "${SCRIPT_DIR}/release-notes.sh" "${SCRIPT_DIR}/create-git-tag.sh" "${ROOT_DIR}/build/"
rm -f "${FRAG_DIR}"/*.md
printf '[Breaking Changes]\n- breaks X\n\n[BugFixes]\n- fix A\n' > "${FRAG_DIR}/0001-tagged.md"
commit_frag 2026-03-01T00:00:00 'changelog: tag-body fixture'
TAG_MATCH='v*' bash "${ROOT_DIR}/build/create-git-tag.sh" v9.9.9 >/dev/null 2>&1

# Without a subject of its own the notes' opening header and its first bullet
# become one run-on subject, which is what `git tag -n` and GitHub's tag list
# display.
check "tag subject is the release name, not the first bullet" \
  "Stratos v9.9.9" "$(repo_git tag -l v9.9.9 --format='%(subject)')"

# git's default message cleanup strips '#' lines as comments, and a markdown
# '## Section' heading is exactly that — every heading vanished from the body
# while assemble output looked correct.
check "markdown headings survive into the tag body" \
  "## Breaking Changes
## Bug Fixes" "$(repo_git tag -l v9.9.9 --format='%(body)' | grep '^## ')"

# The tag body is the published notes; drift between them is the bug class.
check "tag body round-trips the assembled notes" \
  "$(bash "${RN}" assemble)" "$(repo_git tag -l v9.9.9 --format='%(body)')"

echo ""
echo "${PASS} passed, ${FAIL} failed"
exit $((FAIL > 0 ? 1 : 0))
