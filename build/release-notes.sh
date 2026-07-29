#!/usr/bin/env bash
# Release-notes fragments — see changelog.d/README.md for the convention.
#
#   release-notes.sh new [slug]   Create changelog.d/NNNN-<slug>.md
#                                 (slug defaults to the current branch)
#   release-notes.sh deps [since] Draft the dependency-updates fragment from
#                                 the dependabot commits in the release
#                                 window (since defaults to the last v* tag)
#   release-notes.sh check [since] Warn if the window has dependency bumps
#                                 with no dependency-updates fragment.
#                                 Always exits 0 — this reports, never gates
#   release-notes.sh assemble     Print fragments merged into the release
#                                 layout on stdout (empty if no fragments)
#   release-notes.sh sweep        git rm all fragments (post-publish; the
#                                 removal commit rides the next PR)
#
# Fragments are consumed by build/create-git-tag.sh, which embeds the
# assembled notes in the annotated release tag body; `make publish` then
# uses the tag body as the GitHub release notes (--notes-from-tag).

set -euo pipefail

ROOT_DIR="${ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
FRAG_DIR="${FRAG_DIR:-${ROOT_DIR}/changelog.d}"

# Section order is the release-notes layout: Breaking Changes lead when
# present; Security Updates (CVE table) close.
SECTION_ORDER='Breaking Changes|Features|BugFixes|Chores|Security Updates'

fragments() {
  find "${FRAG_DIR}" -maxdepth 1 -name '[0-9]*.md' 2>/dev/null | LC_ALL=C sort
}

# Next free NNNN-<slug>.md path. Errors if the slug is empty or taken.
next_file() {
  local slug
  slug=$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' \
    | tr -cs 'a-z0-9' '-' | sed 's/^-*//; s/-*$//')
  if [ -z "${slug}" ]; then
    echo "ERROR: empty slug (detached HEAD?) — pass one: release-notes.sh new <slug>" >&2
    exit 1
  fi
  local max=0 n f
  for f in $(fragments); do
    n=$(basename "${f}")
    n=$((10#${n%%-*}))
    [ "${n}" -gt "${max}" ] && max=${n}
  done
  local file
  file=$(printf '%s/%04d-%s.md' "${FRAG_DIR}" $((max + 1)) "${slug}")
  if [ -e "${file}" ]; then
    echo "ERROR: ${file} already exists" >&2
    exit 1
  fi
  echo "${file}"
}

cmd_new() {
  local file
  file=$(next_file "${1:-$(git -C "${ROOT_DIR}" branch --show-current)}")
  printf '[Features]\n- \n' > "${file}"
  echo "${file}"
}

# The release window: <last v* tag>..HEAD, or all history before the first
# tag. Dependabot is the reason this is derived rather than authored — it
# opens PRs but never runs this script, so its bumps reach a release only if
# something reads them out of the log.
dep_range() {
  local since="${1:-}"
  if [ -z "${since}" ]; then
    since=$(git -C "${ROOT_DIR}" describe --tags --match 'v[0-9]*' --abbrev=0 2>/dev/null || true)
  fi
  echo "${since:+${since}..}HEAD"
}

# Bump subjects in the window, prefix stripped, deduped, oldest first.
# Keyed on the commit-message prefix pinned in .github/dependabot.yaml,
# which also catches dependency work done by hand under the same prefix —
# for a changelog bullet that is wanted, not a miss.
dep_subjects() {
  git -C "${ROOT_DIR}" log --reverse --no-merges --format='%s' \
      --grep='^chore(deps' "$(dep_range "${1:-}")" -- 2>/dev/null \
    | sed -E 's/^chore\(deps[^)]*\): *(bump )?//I' \
    | awk 'NF && !seen[$0]++'
}

DEPS_SLUG='dependency-updates'

cmd_deps() {
  local subjects
  subjects=$(dep_subjects "${1:-}")
  if [ -z "${subjects}" ]; then
    echo "changelog.d: no dependency bumps in $(dep_range "${1:-}") — nothing to draft"
    return 0
  fi
  local file
  file=$(next_file "${DEPS_SLUG}")
  {
    echo '[Chores]'
    printf -- '- Dependency updates: %s.\n' \
      "$(echo "${subjects}" | paste -sd ';' - | sed 's/;/; /g')"
  } > "${file}"
  echo "${file}"
  echo "Drafted from $(echo "${subjects}" | wc -l | tr -d ' ') bump(s) in $(dep_range "${1:-}") — edit into prose before release." >&2
}

# Does any fragment cover dependency work? Deliberately a loose text match and
# not an exact one against the bump subjects: `deps` writes a DRAFT that the
# author is meant to rewrite into prose, and prose that no longer quotes the
# raw subjects would make an exact match warn on every well-curated release.
#
# Known limit: a dependency fragment left behind from an already-published
# window silences the report for the current one. `make sweep` after each
# release is what keeps that from happening; the directory is meant to be
# empty right after a release (see changelog.d/README.md).
has_deps_fragment() {
  local files
  files=$(fragments)
  [ -n "${files}" ] || return 1   # empty input would leave grep reading stdin
  echo "${files}" | xargs grep -qiE 'depend|bump' 2>/dev/null
}

# The count goes to stdout unconditionally, so this doubles as an any-time
# status command: "how much dependency work has piled up since the last
# release" is the question that decides whether a patch build is due, and it
# needs answering between releases, not only at tag time.
cmd_check() {
  local n
  n=$(dep_subjects "${1:-}" | wc -l | tr -d ' ')
  echo "changelog.d: ${n} dependency bump(s) in $(dep_range "${1:-}")"
  { [ "${n}" -gt 0 ] && ! has_deps_fragment; } || return 0
  echo "WARNING: none of them are mentioned in any fragment, so they will not" >&2
  echo "         appear in the release notes. Draft them: ./build/release-notes.sh deps" >&2
}

cmd_assemble() {
  local files
  files=$(fragments)
  [ -n "${files}" ] || return 0
  # shellcheck disable=SC2086  # fragment paths contain no whitespace
  awk -v order="${SECTION_ORDER}" '
    BEGIN {
      norder = split(order, sections, "|")
      for (i = 1; i <= norder; i++) valid[sections[i]] = 1
    }
    FNR == 1 { section = ""; delete pending }
    /^\[[^]]+\][[:space:]]*$/ {
      s = $0
      sub(/^\[/, "", s); sub(/\][[:space:]]*$/, "", s)
      if (!(s in valid)) {
        printf "ERROR: %s: unknown section [%s]\n", FILENAME, s > "/dev/stderr"
        err = 1; exit 1
      }
      section = s
      delete pending
      next
    }
    {
      if (section == "") {
        if ($0 ~ /^[[:space:]]*$/) next
        printf "ERROR: %s: content before any [Section] header\n", FILENAME > "/dev/stderr"
        err = 1; exit 1
      }
      # Blank lines buffer lazily so they only land between content lines
      # of the same section in the same fragment (e.g. before a table),
      # never at section boundaries or between merged fragments.
      if ($0 ~ /^[[:space:]]*$/) { pending[section] = pending[section] "\n"; next }
      buf[section] = buf[section] pending[section] $0 "\n"
      delete pending[section]
    }
    END {
      if (err) exit 1
      for (i = 1; i <= norder; i++) {
        s = sections[i]; b = buf[s]
        sub(/^\n+/, "", b)
        sub(/\n+$/, "\n", b)
        if (b !~ /[^[:space:]]/) continue
        if (out) printf "\n"
        printf "[%s]\n%s", s, b
        out = 1
      }
    }
  ' ${files}
}

cmd_sweep() {
  local files
  files=$(fragments)
  if [ -z "${files}" ]; then
    echo "changelog.d: nothing to sweep"
    return 0
  fi
  echo "${files}" | xargs git -C "${ROOT_DIR}" rm -q --
  echo "Swept $(echo "${files}" | wc -l | tr -d ' ') fragment(s) — commit this with the next PR (e.g. the post-release bump)."
}

case "${1:-}" in
  new)      shift; cmd_new "$@" ;;
  deps)     shift; cmd_deps "$@" ;;
  check)    shift; cmd_check "$@" ;;
  assemble) cmd_assemble ;;
  sweep)    cmd_sweep ;;
  *)
    echo "Usage: release-notes.sh new [slug] | deps [since] | check [since] | assemble | sweep" >&2
    exit 1
    ;;
esac
