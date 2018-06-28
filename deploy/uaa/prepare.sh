#!/bin/bash
set -eu

# Download the required archives so that they are cached locally for docker build

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOWNLOAD_FOLDER=${DIR}/tmp

echo "Cacheing UAA resources to: ${DOWNLOAD_FOLDER}"

mkdir -p ${DOWNLOAD_FOLDER}

TOMCAT_FILE=${DOWNLOAD_FOLDER}/apache-tomcat-8.0.28.tar.gz

# Get war directly from Maven repository
UAA_VERSION=4.19.0
UAA_FILE=${DOWNLOAD_FOLDER}/cloudfoundry-identity-uaa-${UAA_VERSION}.war
URL_URL=http://central.maven.org/maven2/org/cloudfoundry/identity/cloudfoundry-identity-uaa/${UAA_VERSION}/cloudfoundry-identity-uaa-${UAA_VERSION}.war

if [ ! -f ${TOMCAT_FILE} ]; then
  echo "Dowloading Apache Tomcat package"
  curl -L -o ${TOMCAT_FILE} https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz
fi

if [ ! -f ${UAA_FILE} ]; then
  echo "Dowloading Cloud Foundry UAA package"
  curl -L -o ${UAA_FILE} ${URL_URL}
fi
