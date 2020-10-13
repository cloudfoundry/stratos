#!/usr/bin/env bash

# Build back-end Jetstream

# Use tmp folder as our GOPATH for the build

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

# Build backend or run tests
pushd "${STRATOS}/src/jetstream" > /dev/null

if [ "${ACTION}" == "build" ]; then
  echo "Building backend ..."
  echo "Generating OpenAPI documentation..."
  go get github.com/swaggo/swag/cmd/swag
  swag init
  if [ $? -ne 0 ]; then
    echo "ERROR Running OpenAPI documentation generation"
  fi
  echo "Building version: ${VERSION}"
  GO111MODULE=on go build -ldflags -X=main.appVersion=${VERSION}
  echo "Build complete ..."
else
  echo "Running backend tests ..."
  echo "Generating OpenAPI documentation..."
  go get github.com/swaggo/swag/cmd/swag
  swag init
  GO111MODULE=on go test ./... -v -count=1
fi

popd > /dev/null

popd > /dev/null
