#!/bin/bash
set -eu

# Program Paths:
PROG=$(basename ${BASH_SOURCE[0]})
PROG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Compose files
DEV_DOCKER_COMPOSE_ALL="docker-compose.development.yml"
DEV_DOCKER_COMPOSE_NO_UI="docker-compose.no-ui.development.yml"

# Stratos Paths:
PROXY_DIR="${GOPATH}/src/github.com/hpcloud/portal-proxy/"
ENV_RC="development.rc"

NO_UI=false
CLEAN=false

function usage {
    echo "usage: $PROG [-c] [-n]"
    echo "       -c    Clean up before building."
    echo "       -n    Skip the UI (use with \"gulp dev\")."
    exit 1
}

function clean {
    echo "===== Cleaning up cached intermediate items"

    if [ "$NO_UI" != true ]; then
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
    fi

    echo "----- containers, images"
    pushd ../stratos-deploy
    # it's ok if this section fails
    set +e
    docker-compose -f ${DEV_DOCKER_COMPOSE_ALL} down --rmi 'all'
    # reset back to strict
    set -e
    popd

    echo "----- portal-proxy"
    pushd ${PROXY_DIR}
    [ -f portal-proxy ] && rm -f portal-proxy
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

    export USER_ID=$(id -u)
    export GROUP_ID=$(id -g)
    export USER_NAME=$(id -nu)
    echo "==== User set to ${USER_NAME} with IDs ${USER_ID}:${GROUP_ID}"

    pushd ${PROXY_DIR}/tools/
    ./build_portal_proxy.sh
    popd

    if [ "$NO_UI" = true ]; then
        echo "===== Standing up the Stackato Console without the UI"
    else
        echo "===== Standing up the whole Helion Stackato Console"
        # Prevent docker from creating dist as root if it doesn't exist
        mkdir -p ../stratos-ui/dist
    fi

    docker-compose -f ${DEV_DOCKER_COMPOSE} build
    docker-compose -f ${DEV_DOCKER_COMPOSE} up -d
}

while getopts ":hcn" opt ; do
    case $opt in
        c)
            CLEAN=true
            ;;
        n)
            NO_UI=true
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

if [ "$NO_UI" = true ]; then
    DEV_DOCKER_COMPOSE=${DEV_DOCKER_COMPOSE_NO_UI}
else
    DEV_DOCKER_COMPOSE=${DEV_DOCKER_COMPOSE_ALL}
fi

pushd "$PROG_DIR"
env_vars
if [ "$CLEAN" = true ] ; then
    clean
fi
build
docker ps
popd
