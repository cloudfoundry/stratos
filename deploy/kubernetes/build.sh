#!/usr/bin/env bash
set -eu

# Set defaults
PROD_RELEASE=false
DOCKER_REGISTRY=docker.io
DOCKER_ORG=splatform
BASE_IMAGE_TAG=opensuse
OFFICIAL_TAG=cap
TAG=$(date -u +"%Y%m%dT%H%M%SZ")
ADD_OFFICIAL_TAG="false"
TAG_LATEST="false"
NO_PUSH="false"
while getopts ":ho:r:t:Tclb:O" opt; do
  case $opt in
    h)
      echo
      echo "--- To build images of the Console: "
      echo
      echo " ./build.sh -t 1.0.13"
      echo
      exit 0
      ;;
     r)
      DOCKER_REGISTRY="${OPTARG}"
      ;;
    o)
      DOCKER_ORG="${OPTARG}"
      ;;
    t)
      TAG="${OPTARG}"
      ;;
    b)
      BASE_IMAGE_TAG="${OPTARG}"
      ;;
    T)
      TAG="$(git describe $(git rev-list --tags --max-count=1))"
      RELEASE_TAG="$(git describe $(git rev-list --tags --max-count=1))"
      ;;
    c)
      CONCOURSE_BUILD="true"
      ;;
    O)
      ADD_OFFICIAL_TAG="true"
      ;;
    l)
      TAG_LATEST="true"
      ;;
    \?)
      echo "Invalid option: -${OPTARG}" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

echo
echo "PRODUCTION BUILD/RELEASE: ${PROD_RELEASE}"
echo "REGISTRY: ${DOCKER_REGISTRY}"
echo "ORG: ${DOCKER_ORG}"
echo "TAG: ${TAG}"
echo "BASE_IMAGE_TAG: ${BASE_IMAGE_TAG}"

echo
echo "Starting build"

# Copy values template
__DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRATOS_PATH=${__DIRNAME}/../../
source ${STRATOS_PATH}/deploy/common-build.sh

function patchAndPushImage {
  NAME=${1}
  DOCKER_FILE=${2}
  FOLDER=${3}
  TARGET=${4:-none}

  patchDockerfile ${DOCKER_FILE} ${FOLDER}
  buildAndPublishImage ${NAME} ${DOCKER_FILE} ${FOLDER} ${TARGET}
  unPatchDockerfile ${DOCKER_FILE} ${FOLDER}
}

function pushGitTag {
  pushd ${1} > /dev/null 2>&1
  LOCATION=$(pwd -P)
  echo "LOCATION: ${LOCATION}"
  # Create a local tag
  git tag "${TAG}"
  # Push the tag to the shared repo
  git push origin "${TAG}"
  popd > /dev/null 2>&1
}

function patchDockerfile {
  DOCKER_FILE=${1}
  FOLDER=${2}

  # Replace registry/organization
  pushd ${FOLDER} > /dev/null 2>&1
  pwd
  sed -i "s@splatform@${DOCKER_REGISTRY}/${DOCKER_ORG}@g" ${FOLDER}/${DOCKER_FILE}
  sed -i "s/opensuse/${BASE_IMAGE_TAG}/g" ${FOLDER}/${DOCKER_FILE}
  popd > /dev/null 2>&1

}

function unPatchDockerfile {
  DOCKER_FILE=${1}
  FOLDER=${2}

  # Replace registry/organization
  pushd ${FOLDER} > /dev/null 2>&1
  pwd
  sed -i "s@${DOCKER_REGISTRY}/${DOCKER_ORG}@splatform@g" ${FOLDER}/${DOCKER_FILE}
  sed -i "s/${BASE_IMAGE_TAG}/opensuse/g" ${FOLDER}/${DOCKER_FILE}
  popd > /dev/null 2>&1

}

function buildJetstream {
  echo
  echo "-- Building the Stratos Backend"

  echo
  echo "-- Build & publish the runtime container image for the Console jetstream"
  patchAndPushImage stratos-jetstream deploy/Dockerfile.bk ${STRATOS_PATH} prod-build
}

function buildPostflightJob {
  # Build the postflight container
  echo
  echo "-- Build & publish the runtime container image for the postflight job"
  patchAndPushImage stratos-postflight-job deploy/Dockerfile.bk ${STRATOS_PATH}  postflight-job
}

function buildMariaDb {
  echo
  echo "-- Building/publishing MariaDB"
  # Download and retag image to save bandwidth
  patchAndPushImage stratos-mariadb Dockerfile.mariadb ${STRATOS_PATH}/deploy/db
}

function buildUI {
  # Build and push an image based on the nginx container
  echo
  echo "-- Building/publishing the runtime container image for the Console web server"
  # Download and retag image to save bandwidth
  patchAndPushImage stratos-console deploy/Dockerfile.ui ${STRATOS_PATH} prod-build
}

# MAIN ------------------------------------------------------
#

# Set the path to the portal jetstream
STRATOS_PATH=${STRATOS_PATH}

# cleanup output, intermediate artifacts
cleanup

updateTagForRelease

# Build all of the components that make up the Console
buildJetstream
buildPostflightJob
buildMariaDb
buildUI

# Fetch subcharts
helm dependency update

if [ ${CONCOURSE_BUILD:-"not-set"} == "not-set" ]; then
  # Patch Values.yaml file
  cp values.yaml.tmpl values.yaml
  sed -i -e 's/CONSOLE_VERSION/'"${TAG}"'/g' values.yaml
  sed -i -e 's/DOCKER_REGISTRY/'"${DOCKER_REGISTRY}"'/g' values.yaml
  sed -i -e 's/DOCKER_ORGANISATION/'"${DOCKER_ORG}"'/g' values.yaml
else
  sed -i -e 's/consoleVersion: latest/consoleVersion: '"${TAG}"'/g' console/values.yaml
  sed -i -e 's/organization: splatform/organization: '"${DOCKER_ORG}"'/g' console/values.yaml
  sed -i -e 's/hostname: docker.io/hostname: '"${DOCKER_REGISTRY}"'/g' console/values.yaml
  
  sed -i -e 's/version: 0.1.0/version: '"${RELEASE_TAG}"'/g' console/Chart.yaml
fi

echo
echo "Build complete...."
echo "Registry: ${DOCKER_REGISTRY}"
echo "Org: ${DOCKER_ORG}"
echo "Tag: ${TAG}"
if [ ${CONCOURSE_BUILD:-"not-set"} == "not-set" ]; then
  echo "To deploy using Helm, execute the following: "
  echo "helm install console -f values.yaml --namespace console --name my-console"
fi
