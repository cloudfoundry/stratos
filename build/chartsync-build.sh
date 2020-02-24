#!/usr/bin/env bash

# Build chart-sync

DEV=${STRATOS_BACKEND_DEV:-false}
ACTION=${1:-build}
NO_DEP=${STRATOS_USE_VENDOR_AS_IS:-false}
VERSION=${stratos_version:-dev}

set -euo pipefail

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

pushd "${STRATOS}" > /dev/null

# Determine the build version from the package file if not already set
if [ "${VERSION}" == "dev" ]; then
  PACKAGE_VERSION=$(cat package.json | grep "version")
  REGEX="\"version\": \"([0-9\.]*)\""
  if [[ $PACKAGE_VERSION =~ $REGEX ]]; then
    VERSION=${BASH_REMATCH[1]}
  fi
fi

# Build chart sync tool
pushd "${STRATOS}/src/jetstream/plugins/monocular/chart-repo" > /dev/null

if [ "${ACTION}" == "build" ]; then
  echo "Building chart sync tool ..."
  echo "Building chart sync tool: ${VERSION}"
  GO111MODULE=on go build -ldflags -X=main.appVersion=${VERSION}
  echo "Build complete ..."
# else
#   echo "Running backend tests ..."
#   GO111MODULE=on go test ./... -v -count=1
fi

popd > /dev/null

popd > /dev/null