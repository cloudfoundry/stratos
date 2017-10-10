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
  BASE_IMAGE=${BASE_IMAGE} ./mo ${__DIRNAME}/$i > ${i/.tmpl} 
done


pwd
build_and_push_image() {
    image_name=$1
    docker_file=$2
    docker build . -f $docker_file  -t ${REGISTRY}/${ORGANIZATION}/${image_name}:${TAG}
    docker push ${REGISTRY}/${ORGANIZATION}/${image_name}:${TAG}
}
# Base image with node installed
build_go_base(){
   build_and_push_image stratos-go-base Dockerfile.stratos-go-base
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
    pushd  ${DEPLOY_PATH}/
    TAG=dev tools/build-push-proxy-builder-image.sh
    popd
}

build_postflight_job_base(){
    pushd ${DEPLOY_PATH}/
    TAG=dev tools/build-postflight-image-builder.sh
    popd
}

build_preflight_job_base(){
    build_and_push_image stratos-preflight-base Dockerfile.stratos-preflight-base
}

# Base with go
# build_go_base
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
# Used for building the postflight job image
build_postflight_job_base;
# Used for building the preflight job image
build_preflight_job_base;
rm -f mo;