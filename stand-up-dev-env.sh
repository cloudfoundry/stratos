#!/bin/bash
set -eu

# Program Paths:
PROG=$(basename ${BASH_SOURCE[0]})
PROG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Stratos Paths:
PROXY_DIR="${GOPATH}/src/github.com/hpcloud/portal-proxy/"
DEV_DOCKER_COMPOSE="docker-compose.development.yml"
ENV_RC="development.rc"

CLEAN=false


function usage {
    echo "usage: $PROG [-c]"
    echo "       -c    Clean npm and bower components from repos before building."
    exit 1
}


function clean {
    echo "===== Cleaning up cached intermediate items"

    echo "----- helion-ui-framework"
    pushd ../helion-ui-framework
    rm -rf lib/
    rm -rf node_modules/
    rm -rf bower_components/
    popd

    echo "----- stratos-ui"
    pushd ../stratos-ui
    rm -rf dist/
    rm -rf nginx/
    rm -rf src/lib/
    rm -rf tools/node_modules/
    popd

    echo "----- containers, images"
    pushd ../stratos-deploy
    # it's ok if this section fails
    set +e
    docker-compose -f ${DEV_DOCKER_COMPOSE} down --rmi 'all'
    docker rmi -f console-proxy-builder
    # reset back to strict
    set -e
    popd

    echo "----- portal-proxy"
    pushd ${PROXY_DIR}
    [ -f portal-proxy ] && rm portal-proxy
    popd
}


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


function build {
    echo "===== Building the portal proxy"
    pushd ${PROXY_DIR}/tools/
    ./build_portal_proxy.sh
    popd

    echo "===== Standing up the Helion Stackato Console"
    docker-compose -f ${DEV_DOCKER_COMPOSE} build && \
        docker-compose -f ${DEV_DOCKER_COMPOSE} up -d
}


function info {
    docker ps

    echo "Discover the IP address of the Helion Stackato Console:"
    echo "docker-machine ip [machine-name]"

    echo "===== Done!"
}


while getopts ":hc" opt ; do
    case $opt in
        c)
            CLEAN=true
            ;;
        h)
            usage
            ;;
        \?)
            echo "Invalid option -$OPTARG" >&2
            usage
            ;;
    esac
done

pushd "$PROG_DIR"
env_vars
if [ "$CLEAN" = "true" ] ; then
    clean
fi
build
info
popd
