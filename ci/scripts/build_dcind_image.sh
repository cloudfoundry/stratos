#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOWNLOAD_FOLDER=${DIRPATH}/tmp
source ${DIRPATH}/build_common.sh

wget -P ${DOWNLOAD_FOLDER} https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz
wget -P ${DOWNLOAD_FOLDER} https://github.com/sequenceiq/uaa/releases/download/3.9.3/cloudfoundry-identity-uaa-3.9.3.war

echo FROM amidos/dcind:latest > Dockerfile.dcind

echo COPY daemon.json /etc/docker/ >> Dockerfile.dcind

# Get registry.paas-ui host key
TMP_FILE=$(mktemp)
ssh-keyscan registry.paas-ui > $TMP_FILE 2> /dev/null
ECDSA_FINGERPRINT=$(cat $TMP_FILE | grep ecdsa)
cat << EOT >> Dockerfile.dcind
RUN apk update && \\
        apk add dropbear-scp && \\
	apk add dropbear
RUN  dropbearkey -t rsa -f id_rsa
RUN mkdir /root/.ssh
RUN echo ${ECDSA_FINGERPRINT} > /root/.ssh/known_hosts
EOT
for tarball in $(ls tmp/); do
  echo COPY ./tmp/$tarball /tarballs/$tarball >> Dockerfile.dcind
done

docker build -f Dockerfile.dcind ./ -t ${REGISTRY}stackatotest/hsc-dcind:${TAG} ${BUILD_ARGS}
rm -rf tmp
rm -f Dockerfile.dcind

