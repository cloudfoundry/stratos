#!/bin/bash

TOOLSDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAINDIR="$( cd "$( dirname "${TOOLSDIR}" )" && pwd )"

pushd "${MAINDIR}"
docker-compose -f docker-compose.development.yml stop nginx
docker-compose -f docker-compose.development.yml stop proxy
docker-compose -f docker-compose.development.yml rm -fa proxy

pushd $GOPATH/src/github.com/hpcloud/portal-proxy
./tools/build_portal_proxy.sh
popd

docker-compose -f docker-compose.development.yml up -d proxy
docker-compose -f docker-compose.development.yml up -d nginx
popd
