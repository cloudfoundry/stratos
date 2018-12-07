#!/bin/bash

# Builds the Docker image used by our Concourse pipelines

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}
DOCKER_ORG=${DOCKER_ORG:-splatform}
TAG=${TAG:-latest}

source ${DIRPATH}/build_common.sh

docker build  -f Dockerfile.stratos-ci ./ -t ${DOCKER_REGISTRY}/${DOCKER_ORG}/stratos-ci-concourse:${TAG} \
    ${BUILD_ARGS}

echo "Push this image to publish for use in Concourse:"
echo "  docker push ${DOCKER_REGISTRY}/${DOCKER_ORG}/stratos-ci-concourse:${TAG}"
