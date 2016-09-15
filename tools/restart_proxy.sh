#!/bin/bash

ENV_RC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"
ENV_RC="development.rc"
TOOLSDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAINDIR="$( cd "$( dirname "${TOOLSDIR}" )" && pwd )"

function env_vars {
    echo "===== Environment variables"
    if [ -f $ENV_RC ] ; then
        echo "Found environment variables file: $ENV_RC"
        source $ENV_RC
    else
        echo "Did not find environment variables file: $ENV_RC"
        echo "Your build may fail if the proper environment variables are missing."
    fi
}

pushd "${ENV_RC_DIR}"
env_vars
pushd "${MAINDIR}"
docker-compose -f docker-compose.development.yml stop proxy
docker-compose -f docker-compose.development.yml rm -fa proxy

pushd $GOPATH/src/github.com/hpcloud/portal-proxy
./tools/build_portal_proxy.sh
popd

docker-compose -f docker-compose.development.yml up -d proxy
popd
