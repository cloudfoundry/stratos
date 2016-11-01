#!/bin/bash

ENV_RC="development.rc"
TOOLSDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAINDIR="$( cd "$( dirname "${TOOLSDIR}" )" && pwd )"

function env_vars {
    echo "===== Environment variables"
    if [ -f ${ENV_RC} ]; then
        echo -e "\033[32mFound environment variables file: ${ENV_RC}\033[0m"
        source ${ENV_RC}
    else
        echo -e "\033[31mDid not find environment variables file: ${ENV_RC}"
        echo -e "Your build may fail if the proper environment variables are missing.\033[0m"
    fi
}

pushd "${MAINDIR}"
env_vars

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
