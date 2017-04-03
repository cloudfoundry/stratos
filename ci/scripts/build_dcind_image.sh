#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOWNLOAD_FOLDER=${DIRPATH}/tmp
source ${DIRPATH}/build_common.sh

wget -P ${DOWNLOAD_FOLDER} https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz
wget -P ${DOWNLOAD_FOLDER} https://github.com/sequenceiq/uaa/releases/download/3.9.3/cloudfoundry-identity-uaa-3.9.3.war

echo FROM amidos/dcind:latest > Dockerfile.dcind

echo COPY daemon.json /etc/docker/ >> Dockerfile.dcind

for tarball in $(ls tmp/); do
  echo COPY ./tmp/$tarball /tarballs/$tarball >> Dockerfile.dcind
done

docker build -f Dockerfile.dcind ./ stackatotest/hsc-dcind:${TAG} ${BUILD_ARGS}
rm -rf tmp
rm -f Dockerfile.dcind
