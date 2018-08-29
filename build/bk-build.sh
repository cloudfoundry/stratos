#!/usr/bin/env bash

# Build back-end Jetstream

# Use tmp folder as our GOPATH for the build

DEV=${STRATOS_BACKEND_DEV:-false}
ACTION=${1:-build}
NO_DEP=${STRATOS_USE_VENDOR_AS_IS:-false}

set -euo pipefail

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/..";pwd`"

pushd ${STRATOS} > /dev/null


STRATOS_GOBASE=tmp/go/src/github.com/cloudfoundry-incubator/stratos
mkdir -p ${STRATOS_GOBASE}/src

# Remove the temporary source folder if it is already there
rm -rf ${STRATOS_GOBASE}/src/jetstream

# Copy vendor folder if needed
if [ ! -d "${STRATOS_GOBASE}/vendor" ] && [ -d "${STRATOS}/vendor" ]; then
  cp -R ${STRATOS}/vendor ${STRATOS_GOBASE}
fi

# Set go path
export GOPATH=${STRATOS}/tmp/go

# Link in the backend source
pushd ${STRATOS_GOBASE}/src > /dev/null
ln -s ${STRATOS}/src/jetstream jetstream
popd > /dev/null

# Copy dep files
cp Gopkg.* ${STRATOS_GOBASE}

# Check the dependencies - update if needed
if [ "$NO_DEP" == "false" ]; then
  pushd ${STRATOS_GOBASE} > /dev/null
  set +e
  echo "Checking backend dependencies ..."
  dep check -skip-lock
  DEP_CHECK_RESULT=$?
  set -e
  if [ ${DEP_CHECK_RESULT} -ne 0 ]; then
    echo "Fetching backend dependencies ..."
    # Just downlaod the dependencies using the lock file
    dep ensure -vendor-only -v
  else
    echo "Backend dependencies are up to date (vendor folder okay)"
  fi
  popd > /dev/null
else
  echo "Using vendor folder as is"
fi

# Build backend or run tests
pushd ${STRATOS_GOBASE}/src/jetstream > /dev/null

if [ "${ACTION}" == "build" ]; then
  echo "Building backend ..."
  go build
  # Legacy - we will remove the need for this shortly
  # if [ "$DEV" == "true" ]; then
  #  echo "Copying files to simplify running backend in dev ..."
  # fi
  echo "Build complete ..."
else
  echo "Running backend tests ..."
  go test ./... -v
fi

popd > /dev/null

popd > /dev/null
