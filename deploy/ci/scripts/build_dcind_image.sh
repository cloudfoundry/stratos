#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_REGISTRY=ci-registry.capbristol.com:5000
TAG=${TAG:-latest}
REGISTRY_USER=${REGISTRY_USER:-ubuntu}

DOWNLOAD_FOLDER=${DIRPATH}/tmp
source ${DIRPATH}/build_common.sh

# Generate Dropbear key for ssh'ing logs to $REGISTRY_ADDRESS
PUBLIC_KEY=$(docker run -v $PWD:/key splatform/alpine-dropbear dropbearkey -t rsa -f key/id_rsa | grep "^ssh-rsa")

# Get n ${REGISTRY_ADDRESS} host key
TMP_FILE=$(mktemp)
ssh-keyscan ${REGISTRY_ADDRESS} > $TMP_FILE 2> /dev/null
ECDSA_FINGERPRINT=$(cat $TMP_FILE | grep ecdsa)
echo ${PUBLIC_KEY} | ssh ${REGISTRY_USER}@${DOCKER_REGISTRY} "cat >> ~/.ssh/authorized_keys"

cat << EOT > Dockerfile.dcind
FROM amidos/dcind:latest
COPY daemon.json /etc/docker/
RUN apk update && \\
        apk add dropbear-scp && \\
        apk add bash && \\
        apk add git && \\
        apk add dropbear
ADD id_rsa /
RUN mkdir /root/.ssh
RUN echo ${ECDSA_FINGERPRINT} > /root/.ssh/known_hosts
ADD https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz /tarballs/
ADD https://github.com/sequenceiq/uaa/releases/download/3.9.3/cloudfoundry-identity-uaa-3.9.3.war /tarballs/
EOT

sudo docker build -f Dockerfile.dcind ./ -t ${DOCKER_REGISTRY}/concourse-dcind:${TAG} ${BUILD_ARGS}
rm -f Dockerfile.dcind
sudo rm -f id_rsa

