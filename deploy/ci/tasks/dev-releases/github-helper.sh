#!/bin/bash

# Generate release title for the given tag
generateReleaseTitle() {
  local GIT_TAG=${1}
  IFS='-' read -ra REL_PARTS <<< "$GIT_TAG"

  PRE_RELEASE_ARG="--pre-release"

  if [ "${REL_PARTS[1]}" == "" ]; then
    # This is the actual release
    RELEASE_TITLE="${REL_PARTS[0]}"
    PRE_RELEASE_ARG=""
    RELEASE_DESCRIPTION=$(cat CHANGELOG.md | sed -n -e "/## ${REL_PARTS[0]}/,/##/p" | sed \$d | tail -n +2)
  else
    IFS='.' read -ra REL_TYPES <<< "${REL_PARTS[1]}"
    REL_TYPE="${REL_TYPES[0]}"
    REL_VER="${REL_TYPES[1]}"

    RELEASE_TITLE="Preview Release"
    if [ "$REL_TYPE" == "alpha" ]; then
      RELEASE_TITLE="Alpha ${REL_VER}"
    elif [ "$REL_TYPE" == "beta" ]; then
      RELEASE_TITLE="Beta ${REL_VER}"
    elif [ "$REL_TYPE" == "rc" ]; then
      RELEASE_TITLE="Release Candidate ${REL_VER}"
    fi
    RELEASE_TITLE="${REL_PARTS[0]} $RELEASE_TITLE"
    RELEASE_DESCRIPTION="$RELEASE_TITLE"
  fi
}
