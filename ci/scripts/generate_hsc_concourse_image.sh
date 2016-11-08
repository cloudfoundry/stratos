#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd ${DIRPATH}/../
cp ${DIRPATH}/../../../stratos-ui/tools/package.json .

docker build -f Dockerfile.concourse ./ -t stackatotest/hsc-concourse:latest \
    --build-arg http_proxy=${http_proxy} \
    --build-arg https_proxy=${https_proxy}
