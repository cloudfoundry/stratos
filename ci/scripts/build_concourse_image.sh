#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source ${DIRPATH}/build_common.sh

cd ${DIRPATH}/../
cp ${DIRPATH}/../../../stratos-ui/tools/package.json .

docker build -f Dockerfile.concourse ./ -t stackatotest/hsc-concourse:${TAG} \
    ${BUILD_ARGS}
