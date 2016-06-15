#!/bin/bash
set -eu

PROG=$(basename ${BASH_SOURCE[0]})
PROGDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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
    rm -rf npm_modules
    rm -rf src/lib/
    popd
}


function build {
    echo "===== Building the portal proxy"
    pushd $GOPATH/src/github.com/hpcloud/portal-proxy/tools/
    ./build_portal_proxy.sh
    popd

    echo "===== Standing up the Helion Stackato Console"
    docker-compose -f docker-compose.development.yml build && \
        docker-compose -f docker-compose.development.yml up -d
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

pushd "$PROGDIR"
if [ "$CLEAN" = "true" ] ; then
    clean
fi
build
info
popd

