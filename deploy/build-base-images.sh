#!/bin/bash

BASE_IMAGE=opensuse:42.3
REGISTRY=docker.io
ORGANIZATION=splatform
TAG=dev
PUSH_IMAGES=

build_and_push_image() {
    image_name=$1
    docker build . -t ${REGISTRY}/${ORGANIZATION}/${image_name}:${TAG}
    if [ -z ${PUSH_IMAGES} ]; then
        docker push ${REGISTRY}/${ORGANIZATION}/${image_name}:${TAG}
    fi
}
# Base image with node installed
build_ui_base(){

    tmp_dir=$(mktemp -d)
    pushd $tmp_dir
    cat << EOF > Dockerfile
    FROM ${BASE_IMAGE}

    RUN zypper -n ref && \
    zypper -n up && \
    zypper in -y wget tar
    RUN wget https://nodejs.org/dist/v6.11.4/node-v6.11.4-linux-x64.tar.xz && \
    tar -xf node-v6.11.4-linux-x64.tar.xz
    ENV PATH $PATH:node-v6.11.4-linux-x64/bin
EOF
       build_and_push_image stratos-ui-base
    popd
}

build_nginx_base(){
    tmp_dir=$(mktemp -d)
    pushd $tmp_dir
    cat << EOF > Dockerfile

EOF 
    build_and_push_image stratos-nginx-base
    popd
}

build_bk_base(){
    tmp_dir=$(mktemp -d)
    pushd $tmp_dir
    cat << EOF > Dockerfile

EOF 
    build_and_push_image stratos-bk-base
    popd
}

build_goose_base(){
    tmp_dir=$(mktemp -d)
    pushd $tmp_dir
    cat << EOF > Dockerfile
    FROM ${BASE_IMAGE}
    RUN zypper install -y go
    RUN go get bitbucket.org/liamstask/goose/cmd/goose
EOF 
    build_and_push_image stratos-goose-base
    popd  
}