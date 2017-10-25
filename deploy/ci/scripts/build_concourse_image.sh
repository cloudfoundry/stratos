#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}
DOCKER_ORG=${DOCKER_ORG:-splatform}
TAG=${TAG:-test}

source ${DIRPATH}/build_common.sh

cd ${DIRPATH}/../../
cp ../package.json .

docker build  -f ci/Dockerfile.concourse ./ -t ${DOCKER_REGISTRY}/${DOCKER_ORG}/stratos-concourse:${TAG} \
    ${BUILD_ARGS}
