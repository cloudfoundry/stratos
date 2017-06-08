#!/usr/bin/env bash
set -eux

DOCKER_REGISTRY=docker.io
DOCKER_ORG=susetest
NAME=console-proxy-builder
TAG=latest

STRATOS_UI_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../../stratos-ui"

pushd ${STRATOS_UI_PATH}
pushd $(git rev-parse --show-toplevel)

SHARED_IMAGE_URL=${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:${TAG}

echo "Building Docker Image for $NAME"
docker build --tag ${NAME} \
             --file tools/Dockerfile.bk.build \
             .

echo "Tag and push the shared image"
docker tag ${NAME} ${SHARED_IMAGE_URL}
docker push ${SHARED_IMAGE_URL}

popd
popd
