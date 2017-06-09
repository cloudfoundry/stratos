#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}
DOCKER_ORG=${DOCKER_ORG:-susetest}
TAG=${TAG:-test}

source ${DIRPATH}/build_common.sh
source ${DIRPATH}/build_common.sh

cd ${DIRPATH}/../
cp ${DIRPATH}/../../../stratos-ui/tools/package.json .

docker build --squash  -f tools/Dockerfile.concourse ./ -t ${DOCKER_REGISTRY}/${DOCKER_ORG}/concourse:${TAG} \
    ${BUILD_ARGS}
