#!/bin/bash

# Program Paths:
PROG=$(basename ${BASH_SOURCE[0]})
PROG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRATOS_DIR="$( cd "${PROG_DIR}/.." && pwd )"

echo "Stratos Directory: ${STRATOS_DIR}"

UPDATE="false"

# Current versions that we should be using
GO_VERSION=1.12.4
NODE_VERSION=10.15.3

ALL_GOOD="true"

function checkGoVersion() {

  FILE=$1
  DESC=$2
  EXISTS=$3
  REPLACE=$4

  if [ ! -f "$FILE" ]; then
    echo "Error: File $FILE does not exist"
  fi

  grep "${EXISTS}" "${FILE}" > /dev/null
  if [ $? -ne 0 ]; then
    echo "${DESC} has incorrect Go version"
    ALL_GOOD="false"

    if [ "$UPDATE" == "true" ]; then
      echo "  => Updating to correct Go version"
      sed -i.bak -e 's/'"$REPLACE"'/'"$EXISTS"'/g' ${FILE}
    fi
  fi
}

if [ "$1" == "-u" ]; then
  UPDATE="true"
  echo "Versions will be updated"
fi

# Check versions in the various files that we have


# Go Version

checkGoVersion "${STRATOS_DIR}/deploy/stratos-base-images/Dockerfile.stratos-go-build-base.tmpl" "Go Builder Base Image" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkGoVersion "${STRATOS_DIR}/.travis.yml" "Travis file" "gimme ${GO_VERSION}" "gimme [0-9\.]*"
checkGoVersion "${STRATOS_DIR}/deploy/ci/travis/depcache.sh" "Depcache generation script" "gimme ${GO_VERSION}" "gimme [0-9\.]*"
checkGoVersion "${STRATOS_DIR}/deploy/ci/travis/run-e2e-tests.sh" "Travis E2E Tests script" "gimme ${GO_VERSION}" "gimme [0-9\.]*"
checkGoVersion "${STRATOS_DIR}/deploy/fissile/Dockerfile.bosh-cli" "BOSH Release Dockerfile" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkGoVersion "${STRATOS_DIR}/deploy/ci/scripts/Dockerfile.bosh" "BOSH Dockerfile" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkGoVersion "${STRATOS_DIR}/deploy/stratos-ui-release/config/blobs.yml" "BOSH Release config file" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkGoVersion "${STRATOS_DIR}/deploy/stratos-ui-release/packages/golang/packaging" "BOSH Release packaging file" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkGoVersion "${STRATOS_DIR}/deploy/stratos-ui-release/packages/golang/spec" "BOSH Release spec file" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkGoVersion "${STRATOS_DIR}/src/frontend/packages/core/test-framework/store-test-helper.ts" "Store test helper" "\'go${GO_VERSION}\'" "\'go[0-9\.]*\'"

if [ "$ALL_GOOD" == "true" ]; then
  echo "All files have correct versions"
else
  echo "Some files do not have correct versions"
fi

echo "NOTE: Please ensure you check the Go version in the Stratos Buildpack"
