#!/bin/bash
set -eu

# Program Paths:
PROG=$(basename ${BASH_SOURCE[0]})
PROG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Compose files
DEV_DOCKER_COMPOSE_ALL="docker-compose.development.yml"
DEV_DOCKER_COMPOSE_NO_UI="docker-compose.no-ui.development.yml"

# Stratos Paths:
ENV_RC="development.rc"

STRATOS_UI_PATH=${PROG_DIR}/../
PROXY_PATH=${STRATOS_UI_PATH}
DEPLOY_PATH=${STRATOS_UI_PATH}/deploy

NO_UI=false
CLEAN=false
PACKAGE_JSON_VERSION=$(cat ${STRATOS_UI_PATH}/package.json| grep version | grep -Eo "([0-9]*.[0-9]*.[0-9]*)\",$" | sed 's/.\{2\}$//')
STRATOS_VERSION=${PACKAGE_JSON_VERSION}-$(git log -1 --format="%h")
function usage {
    echo "usage: $PROG [-c] [-n]"
    echo "       -c    Clean up before building."
    echo "       -n    Skip the UI (use with \"gulp dev\")."
    exit 1
}

function clean {
    echo "===== Cleaning up cached intermediate items"

    if [ "$NO_UI" != true ]; then
        echo "----- stratos-ui"
        pushd ${STRATOS_UI_PATH}
        rm -rf dist/
        rm -rf nginx/
        rm -rf src/lib/
        rm -rf tools/node_modules/
        popd
    fi

    echo "----- containers, images"
    pushd ${DEPLOY_PATH}
    # it's ok if this section fails
    set +e
    docker-compose -f ${DEV_DOCKER_COMPOSE_ALL} down --rmi 'all'
    # reset back to strict
    set -e
    popd

    echo "----- portal-proxy"
    pushd ${PROXY_PATH}
    [ -d outputs ] && rm -rf outputs
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

function uaa_downloads {
    # Download tomcat and uaa war files required for the UAA docker image build
    ./uaa/prepare.sh
}

function dev_certs {
    CERTS_PATH="${PROG_DIR}/../dev-certs"
    if [ ! -d "${CERTS_PATH}" ]; then
        CERTS_PATH=${CERTS_PATH} ./tools/generate_cert.sh
    fi
}

function build {
    if [ "$NO_UI" = true ]; then
        echo "===== Standing up the Stratos UI Console without the UI"
    else
        echo "===== Standing up the Stratos UI Console with the UI"
        # Prevent docker from creating dist as root if it doesn't exist
        mkdir -p ${STRATOS_UI_PATH}/dist
    fi

    # Prevent docker from creating the migration volume as root if it doesn't exist
    mkdir -p ./hsc-upgrade-volume

    docker-compose -f ${DEV_DOCKER_COMPOSE} build --build-arg stratos_version=${STRATOS_VERSION}
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

mkdir -p ${STRATOS_UI_PATH}/.dist
# Copy in the page to tell the user that the UI is being built
cp ./docker-compose/building.html ${STRATOS_UI_PATH}/.dist

pushd "$PROG_DIR"
env_vars
if [ "$CLEAN" = true ] ; then
    clean
fi
uaa_downloads
dev_certs
build
docker ps
popd
