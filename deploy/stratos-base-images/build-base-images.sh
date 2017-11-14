#!/bin/bash
set -ex

BASE_IMAGE=opensuse:42.3
REGISTRY=docker.io
ORGANIZATION=splatform
TAG=opensuse
PROG=$(basename ${BASH_SOURCE[0]})

function usage {
    echo "usage: $PROG [-b BASE] [-r REGISTRY] [-o ORGANIZATION] [-t TAG] [-p] [h]"
    echo "       -b Value   Base Image"
    echo "       -r Value   Docker registry"
    echo "       -o Value   Organization in Docker registry"
    echo "       -t Value   Tag for images"
    echo "       -p         Push images to registry"
    echo "       -s         Is SLE"
    echo "       -h         Help"
    exit 1
}


while getopts "b:r:o:t:psh" opt ; do
    case $opt in
        b)
            BASE_IMAGE=${OPTARG}
            ;;
        r)
            REGISTRY=${OPTARG}
            ;;
        o)
            ORGANIZATION=${OPTARG}
            ;;
        t)
            TAG=${OPTARG}
            ;;
        p)
            PUSH_IMAGES=true
            ;;
        s)
            IS_SLE=true
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


__DIRNAME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_PATH=${__DIRNAME}/..

cd ${__DIRNAME}
DOCKERFILES=$(ls *.tmpl)
pushd $(mktemp -d)
curl -sSO https://raw.githubusercontent.com/tests-always-included/mo/master/mo
chmod +x mo

GO_BUILD_BASE=${REGISTRY}/${ORGANIZATION}/stratos-go-build-base:${TAG}
for i in ${DOCKERFILES}; do
  BASE_IMAGE=${BASE_IMAGE} GO_BUILD_BASE=${GO_BUILD_BASE} IS_SLE=${IS_SLE} ./mo ${__DIRNAME}/$i > ${i/.tmpl} 
done


pwd
build_and_push_image() {
    image_name=$1
    docker_file=$2
    docker build . -f $docker_file  -t ${REGISTRY}/${ORGANIZATION}/${image_name}:${TAG}
    if [ ! -z ${PUSH_IMAGES} ]; then
        docker push ${REGISTRY}/${ORGANIZATION}/${image_name}:${TAG}
    fi
}
# Base image with node installed
build_go_base(){
   build_and_push_image stratos-go-build-base Dockerfile.stratos-go-build-base
}

# Base image with node installed
build_ui_base(){
   build_and_push_image stratos-ui-build-base Dockerfile.stratos-ui-build-base
}

build_nginx_base(){
    build_and_push_image stratos-nginx-base Dockerfile.stratos-nginx-base
}

build_bk_base(){
    build_and_push_image stratos-bk-base Dockerfile.stratos-bk-base
}

build_bk_build_base(){
    build_and_push_image stratos-bk-build-base Dockerfile.stratos-bk-build-base
}

build_portal_proxy_builder(){
    pushd  ${DEPLOY_PATH}/
    BK_BUILD_BASE=${REGISTRY}/${ORGANIZATION}/stratos-bk-build-base:${TAG}
    BK_BUILD_BASE=${BK_BUILD_BASE} TAG=${TAG} DOCKER_REGISTRY=${REGISTRY} DOCKER_ORG=${ORGANIZATION} tools/build-push-proxy-builder-image.sh
    popd
}

build_preflight_job_base(){
    build_and_push_image stratos-preflight-base Dockerfile.stratos-preflight-base
}

build_mariadb_base(){
    build_and_push_image stratos-db-base Dockerfile.stratos-mariadb-base
}

build_aio_base(){
    build_and_push_image stratos-aio-base Dockerfile.stratos-aio-base
}

# Base with go
build_go_base
# Used building the UI
build_ui_base;
# Used for running the backend
build_bk_base;
# Used for hosting nginx
build_nginx_base;
# Used for stratos-proxy-builder base
build_bk_build_base;
# Used for building the backend
build_portal_proxy_builder;
# Used for building the postflight job image
build_preflight_job_base;
# Used for building the DB image
build_mariadb_base;
# Used for building the AIO image
build_aio_base;
rm -f mo;
