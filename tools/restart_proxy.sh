#!/bin/bash

TOOLSDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAINDIR="$( cd "$( dirname "${TOOLSDIR}" )" && pwd )"

pushd "${MAINDIR}"
docker-compose -f docker-compose.development.yml stop nginx
docker-compose -f docker-compose.development.yml stop proxy
docker-compose -f docker-compose.development.yml rm -fa proxy

pushd $GOPATH/src/github.com/hpcloud/portal-proxy
./tools/build_portal_proxy.sh
ret=$?
popd

if [ ${ret} -eq 0 ]; then
    # nginx also restarts the proxy
    docker-compose -f docker-compose.development.yml up -d nginx
else
    echo -e "\033[0;31mOoops Build failed! Not restarting portal-proxy container until you fix the build!\033[0m"
fi

popd

exit ${ret}
