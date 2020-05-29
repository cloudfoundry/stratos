#!/bin/bash

echo "Stratos e2e build"
echo "================="

MC_HOST="s3"

LOCAL_BUILD="true"

# Use Travis env vars:
# TRAVIS_PULL_REQUEST
# TRAVIS_REPO_SLUG
# TRAVIS_COMMIT

if [ -z "$TRAVIS_REPO_SLUG" ]; then
  echo "Need to be running in Travis"
  exit 1
fi

if [ -z "$TRAVIS_COMMIT" ]; then
  echo "Need to be running in Travis"
  exit 1
fi

GIT_ID="${TRAVIS_REPO_SLUG}_${TRAVIS_COMMIT}_${TRAVIS_PULL_REQUEST}"
GIT_ID="${GIT_ID//\//_}"
echo $GIT_ID

TAR_NAME="${GIT_ID}.tar"
GZIP_NAME="${GIT_ID}.tgz"

# Ensure we have the mc command
DIRNAME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRNAME}/e2e-mc-helper.sh"

function tryGetExistingBuild() {
  echo "Looking for existing build: ${GIT_ID}"

  mc cp -q --insecure ${MC_HOST}/${S3_BUILDS_BUCKET}/${GZIP_NAME} ./
  if [ $? -eq 0 ]; then
    # We found an existing build, so download and unpack it
    echo "Downloading build package"
    tar -xvf ${GZIP_NAME} > /dev/null
    if [ $? -eq 0 ]; then
      LOCAL_BUILD="false"
    else 
      echo "Failed to untar the build package"
    fi
    rm -rf ${GZIP_NAME}
  fi
}

if [ -n "${AWS_ENDPOINT}" ]; then
  tryGetExistingBuild
fi

if [ "${LOCAL_BUILD}" == "false" ]; then
  echo "Downloaded and unpacked an existing build - no need to build locally"
else
  set -e

  # Get go
  curl -sL -o ~/bin/gimme https://raw.githubusercontent.com/travis-ci/gimme/master/gimme
  chmod +x ~/bin/gimme
  eval "$(gimme 1.12.4)"
  go version

  npm run build
  npm run build-backend

  set +e
  tar cvfz ${GZIP_NAME} dist/* src/jetstream/jetstream

  # Upload
  mc cp -q --insecure ${GZIP_NAME} ${MC_HOST}/${S3_BUILDS_BUCKET}

  # Ignore error from uploading - should not fail build if we can't upload the build archive
  # This just means we won't be able to us this cache next build
  exit 0

fi
