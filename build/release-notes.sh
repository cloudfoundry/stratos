#!/usr/bin/env bash
# Release-notes fragments — see changelog.d/README.md for the convention.
#
#   release-notes.sh new [slug]   Create changelog.d/NNNN-<slug>.md
#                                 (slug defaults to the current branch)
#   release-notes.sh assemble     Print fragments merged into the release
#                                 layout on stdout (empty if no fragments)
#   release-notes.sh sweep        git rm all fragments (post-publish; the
#                                 removal commit rides the next PR)
#
# Fragments are consumed by build/create-git-tag.sh, which embeds the
# assembled notes in the annotated release tag body; `make publish` then
# uses the tag body as the GitHub release notes (--notes-from-tag).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRAG_DIR="${FRAG_DIR:-${ROOT_DIR}/changelog.d}"

# Section order is the release-notes layout: Breaking Changes lead when
# present; Security Updates (CVE table) close.
SECTION_ORDER='Breaking Changes|Features|BugFixes|Chores|Security Updates'

fragments() {
  find "${FRAG_DIR}" -maxdepth 1 -name '[0-9]*.md' 2>/dev/null | LC_ALL=C sort
}

cmd_new() {
  local slug="${1:-$(git -C "${ROOT_DIR}" branch --show-current)}"
  slug=$(printf '%s' "${slug}" | tr '[:upper:]' '[:lower:]' \
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
  printf '[Features]\n- \n' > "${file}"
  echo "${file}"
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
  assemble) cmd_assemble ;;
  sweep)    cmd_sweep ;;
  *)
    echo "Usage: release-notes.sh new [slug] | assemble | sweep" >&2
    exit 1
    ;;
esac
