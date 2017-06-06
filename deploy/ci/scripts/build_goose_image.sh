#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source ${DIRPATH}/build_common.sh

cd ${DIRPATH}/../../../portal-proxy/db

cat > Dockerfile.goose.tmp << EOL
FROM golang:1.6
RUN go get bitbucket.org/liamstask/goose/cmd/goose
EOL

docker build -f Dockerfile.goose.tmp ./ -t stackatotest/goose:${TAG} \
    ${BUILD_ARGS}

