#!/bin/bash

ENV_RC="development.rc"
TOOLSDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEPLOYDIR="$( cd "$( dirname "${DEPLOYDIR}" )" && pwd )/.."

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

pushd "${DEPLOYDIR}"
ls
env_vars

PACKAGE_JSON_VERSION=$(cat ${DEPLOYDIR}/../package.json | grep version | grep -Po "([0-9\.]?)*")
STRATOS_VERSION=${PACKAGE_JSON_VERSION}-$(git log -1 --format="%h")
BUILD_ARG=" --build-arg stratos_version=${STRATOS_VERSION}"
docker-compose -f docker-compose.development.yml stop nginx
docker-compose -f docker-compose.development.yml  stop proxy
docker-compose -f docker-compose.development.yml rm -f proxy

docker-compose -f docker-compose.development.yml build  ${BUILD_ARG} proxy

docker-compose -f docker-compose.development.yml up -d nginx

popd

exit ${ret}
