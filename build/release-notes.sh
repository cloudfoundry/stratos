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

# Assembly order is when each fragment LANDED, not what it was named.
#
# The NNNN prefix cannot carry chronology: a contributor picks it before the
# work merges, two people branching from the same develop pick the same one,
# and PR numbers would only give the order PRs were OPENED — nothing requires
# them to merge in that order. The commit that ADDED the fragment is the
# authority, and its committer date is the merge time under both rebase- and
# squash-merge, which is how this repo lands PRs.
#
# So the number is now purely a filename disambiguator, and a collision
# between concurrent PRs is harmless again.
#
# --follow is load-bearing: renaming a fragment (renumbering it, say) would
# otherwise register as a fresh add and jump the entry to the end of the
# notes. Following the rename keeps the date the content actually landed.
#
# A fragment git has no record of is being written right now: it sorts last,
# as the newest. Ties keep filename order (sort -s), so assembly stays
# deterministic — including when FRAG_DIR is outside a repo and every
# fragment falls back to the sentinel.
fragments_by_landing() {
  local file landed
  for file in $(fragments); do
    landed=$(git -C "${ROOT_DIR}" log --follow --diff-filter=A -1 --format=%ct -- "${file}" 2>/dev/null) || landed=''
    printf '%s\t%s\n' "${landed:-9999999999}" "${file}"
  done | LC_ALL=C sort -n -s -k1,1 | cut -f2-
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
    # TAG_MATCH (exported by make) scopes the anchor to this checkout's
    # version line, so a maintenance tag back-merged from another line
    # never truncates the window. At the birth of a line no tag matches
    # yet — fall back to the nearest tag of any line (the previous
    # line's final) rather than reporting the whole history.
    since=$(git -C "${ROOT_DIR}" describe --tags --match "${TAG_MATCH:-v[0-9]*}" --abbrev=0 2>/dev/null || true)
    if [ -z "${since}" ]; then
      since=$(git -C "${ROOT_DIR}" describe --tags --match 'v[0-9]*' --abbrev=0 2>/dev/null || true)
    fi
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

# When was dependency work last written up? Answering with a timestamp rather
# than a yes/no is what makes the check survive an incremental window: a
# fragment can only describe bumps that landed before it, so "does any
# fragment mention dependencies" goes quiet the moment one does — even for
# bumps that merge afterwards.
#
# The fragment side stays a loose text match: `deps` writes a DRAFT the author
# is meant to rewrite, and prose that no longer quotes the raw subjects must
# not warn on a well-curated release.
#
# A fragment git has no record of is being written right now, so it covers
# everything; this also keeps the check quiet when FRAG_DIR sits outside the
# repo. Prints nothing when no fragment mentions dependencies at all.
newest_deps_fragment_time() {
  local file t newest=0
  for file in $(fragments); do
    grep -qiE 'depend|bump' "${file}" 2>/dev/null || continue
    t=$(git -C "${ROOT_DIR}" log -1 --format=%ct -- "${file}" 2>/dev/null) || t=''
    [ -n "${t}" ] || { echo uncommitted; return 0; }
    [ "${t}" -gt "${newest}" ] && newest=${t}
  done
  [ "${newest}" -gt 0 ] && echo "${newest}"
}

newest_dep_bump_time() {
  git -C "${ROOT_DIR}" log -1 --format=%ct --no-merges \
      --grep='^chore(deps' "$(dep_range "${1:-}")" -- 2>/dev/null
}

# The count goes to stdout unconditionally, so this doubles as an any-time
# status command: "how much dependency work has piled up since the last
# release" is the question that decides whether a patch build is due, and it
# needs answering between releases, not only at tag time.
cmd_check() {
  local n frag bump why
  n=$(dep_subjects "${1:-}" | wc -l | tr -d ' ')
  echo "changelog.d: ${n} dependency bump(s) in $(dep_range "${1:-}")"
  [ "${n}" -gt 0 ] || return 0

  frag=$(newest_deps_fragment_time || true)
  [ "${frag}" = uncommitted ] && return 0
  bump=$(newest_dep_bump_time "${1:-}" || true)
  { [ -n "${frag}" ] && [ -n "${bump}" ] && [ "${frag}" -ge "${bump}" ]; } && return 0

  why='none of them are mentioned in any fragment'
  [ -n "${frag}" ] && why='some landed after the newest fragment that mentions them'
  echo "WARNING: ${why}, so they will not" >&2
  echo "         appear in the release notes. Draft them: ./build/release-notes.sh deps" >&2
}

cmd_assemble() {
  local files
  files=$(fragments_by_landing)
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
        # [Section] is the authoring syntax, not the output. Emitted as a
        # bracketed literal it renders as plain text wherever these notes
        # land — a GitHub release body is markdown — so the published notes
        # had no headings at all. BugFixes is an identifier and gets a
        # display name; the rest already read as titles.
        label = (s == "BugFixes") ? "Bug Fixes" : s
        printf "## %s\n\n%s", label, b
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
