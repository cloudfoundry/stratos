#!/bin/bash

echo "Stratos e2e build"
echo "================="

MC_HOST="s3"

LOCAL_BUILD="true"

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

# Check git folder
GIT_URL=$(git config --get remote.origin.url)

GIT_REPO="${GIT_URL//:/_}"
GIT_REPO="${GIT_REPO//\@/_}"
GIT_REPO="${GIT_REPO//\//_}"
GIT_REPO=${GIT_REPO%.git}


# Get commit ID
GIT_COMMIT=$(git log --pretty=format:'%h' -n 1)

GIT_ID="${GIT_REPO}__${GIT_COMMIT}"
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
    tar -xvf ${GZIP_NAME}
    if [ $? -eq 0 ]; then
      LOCAL_BUILD="false"
    fi
    rm -rf ${GZIP_NAME}
  fi
}

if [ -n "${AWS_ENDPOINT}" ]; then
  tryGetExistingBuild
fi

if [ "${LOCAL_BUILD}" == "false" ]; then
  echo "Downloaded and unpacked an existing build - no need to build locally"
  exit 0
fi

set -e

# Get go
curl -sL -o ~/bin/gimme https://raw.githubusercontent.com/travis-ci/gimme/master/gimme
chmod +x ~/bin/gimme
eval "$(gimme 1.12.4)"
go version

npm run build
npm run build-backend

set +e2e
tar cvfz ${GZIP_NAME} dist/* src/jetstream/jetstream

# Upload
mc cp -q --insecure ${GZIP_NAME} ${MC_HOST}/${S3_BUILDS_BUCKET}
