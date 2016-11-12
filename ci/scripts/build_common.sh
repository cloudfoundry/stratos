#!/bin/bash

BUILD_ARGS=""
TAG=${TAG:-"test"}

echo "Using ${TAG}"

if [ ! -z ${http_proxy+x} ]; then
  BUILD_ARGS="--build-arg http_proxy=${http_proxy}"
fi

if [ ! -z ${https_proxy+x} ]; then
  BUILD_ARGS="${BUILD_ARGS} --build-arg https_proxy=${https_proxy}"
fi

BUILD_ARGS=${BUILD_ARGS}