#!/bin/bash
set -ex

BASE_IMAGE=opensuse:42.3
REGISTRY=docker.io
ORGANIZATION=splatform
TAG=dev
PUSH_IMAGES=true

__DIRNAME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_PATH=${__DIRNAME}/..

cd ${__DIRNAME}
DOCKERFILES=$(ls *.tmpl)
pushd $(mktemp -d)
curl -sSO https://raw.githubusercontent.com/tests-always-included/mo/master/mo
chmod +x mo

for i in ${DOCKERFILES}; do
   ./mo ${__DIRNAME}/$i > ${i/.tmpl} 
done

build_and_push_image() {
    image_name=$1
    docker_file=$2
    docker build . -f $docker_file  -t ${REGISTRY}/${ORGANIZATION}/${image_name}:${TAG}
    docker push ${REGISTRY}/${ORGANIZATION}/${image_name}:${TAG}
}
# Base image with node installed
build_ui_base(){
   build_and_push_image stratos-ui-base Dockerfile.stratos-ui-base
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

build_goose_base(){
    build_and_push_image stratos-goose-base Dockerfile.stratos-goose-base
}

build_portal_proxy_builder(){
    export TAG=dev
    pushd  ${DEPLOY_PATH}/
    tools/build-push-proxy-builder-image.sh
    popd
}

# Used building the UI
build_ui_base;
# Used for running the backend
build_bk_base;
# Used for goose
build_goose_base;
# Used for hosting nginx
build_nginx_base;
# Used for stratos-proxy-builder base
build_bk_build_base;
# Used for building the backend
build_portal_proxy_builder;
rm -f mo;