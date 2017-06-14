#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}
TAG=${TAG:-test}

DOWNLOAD_FOLDER=${DIRPATH}/tmp
source ${DIRPATH}/build_common.sh

echo FROM amidos/dcind:latest > Dockerfile.dcind

echo COPY daemon.json /etc/docker/ >> Dockerfile.dcind

# Get registry.paas-ui host key
TMP_FILE=$(mktemp)
ssh-keyscan registry.paas-ui > $TMP_FILE 2> /dev/null
ECDSA_FINGERPRINT=$(cat $TMP_FILE | grep ecdsa)
cat << EOT >> Dockerfile.dcind
RUN apk update && \\
        apk add dropbear-scp && \\
        apk add bash && \\
        apk add git && \\
	apk add dropbear
RUN  dropbearkey -t rsa -f id_rsa
RUN mkdir /root/.ssh
RUN echo ${ECDSA_FINGERPRINT} > /root/.ssh/known_hosts
ADD https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz /tarballs/
ADD https://github.com/sequenceiq/uaa/releases/download/3.9.3/cloudfoundry-identity-uaa-3.9.3.war /tarballs/
EOT

docker build -f Dockerfile.dcind ./ -t ${DOCKER_REGISTRY}/concourse-dcind:${TAG} ${BUILD_ARGS}
rm -f Dockerfile.dcind

