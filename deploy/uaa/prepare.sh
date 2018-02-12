#!/bin/bash
set -eu

# Download the required archives so that they are cached locally for docker build

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOWNLOAD_FOLDER=${DIR}/tmp

echo "Cacheing UAA resources to: ${DOWNLOAD_FOLDER}"

mkdir -p ${DOWNLOAD_FOLDER}

TOMCAT_FILE=${DOWNLOAD_FOLDER}/apache-tomcat-8.0.28.tar.gz
UAA_FILE=${DOWNLOAD_FOLDER}/cloudfoundry-identity-uaa-3.9.3.war

if [ ! -f ${TOMCAT_FILE} ]; then
  echo "Dowloading Apache Tomcat package"
  curl -L -o ${TOMCAT_FILE} https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz
fi

if [ ! -f ${UAA_FILE} ]; then
  echo "Dowloading Cloud Foundry UAA package"
  curl -L -o ${UAA_FILE} https://github.com/sequenceiq/uaa/releases/download/3.9.3/cloudfoundry-identity-uaa-3.9.3.war
fi
