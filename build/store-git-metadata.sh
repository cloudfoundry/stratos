#!/bin/bash

# Store the git metadata - only dependency is the git binary

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_METADATA_FILE="${DIRPATH}/../.stratos-git-metadata.json"

GIT_PROJECT=$(git config --get remote.origin.url)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
GIT_COMMIT=$(git rev-parse HEAD)

echo "{" > "${GIT_METADATA_FILE}"
echo "  \"project\": \"${GIT_PROJECT}\"," >> "${GIT_METADATA_FILE}"
echo "  \"branch\": \"${GIT_BRANCH}\"," >> "${GIT_METADATA_FILE}"
echo "  \"commit\": \"${GIT_COMMIT}\"" >> "${GIT_METADATA_FILE}"
echo "}" >> "${GIT_METADATA_FILE}"
