#!/usr/bin/env bash
set -eu

# set defaults
DOCKER_REGISTRY=docker.io
DOCKER_ORG=splatform

TAG=$(date -u +"%Y%m%dT%H%M%SZ")

NO_PUSH="false"
TAG_LATEST="false"

while getopts ":ho:r:t:ln" opt; do
  case $opt in
    h)
      echo
      echo "--- To build images of Stratos: "
      echo
      echo " ./build.sh -t 1.0.13"
      echo
      echo "--- To build images locally of Stratos: "
      echo
      echo " ./build.sh -l -n"
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
    l)
      TAG_LATEST="true"
      ;;
    o)
      DOCKER_ORG="${OPTARG}"
      ;;
    n)
      NO_PUSH="true"
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
echo "=============================================================================="
echo "Stratos Docker Compose Build"
echo "=============================================================================="
echo
echo "TAG: ${TAG}"

if [ "${NO_PUSH}" != "false" ]; then
  echo "Images will NOT be pushed"
else
  echo "Images will be pushed"
  echo "  REGISTRY: ${DOCKER_REGISTRY}"
  echo "  ORG: ${DOCKER_ORG}"
fi

echo
echo "Starting build"

# Copy values template
STRATOS_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." && pwd )"
source "${STRATOS_PATH}/deploy/common-build.sh"

function buildProxy {
  echo
  echo "-- Building the Stratos Backend"

  echo
  echo "-- Build & publish the runtime container image for the Console Proxy"
  buildAndPublishImage stratos-dc-jetstream deploy/Dockerfile.bk "${STRATOS_PATH}" dev-build
}

function buildDbMigratorJob {
  # Build the db-migrator container
  echo
  echo "-- Build & publish the runtime container image for the db-migrator job"
  buildAndPublishImage stratos-dc-db-migrator deploy/Dockerfile.bk "${STRATOS_PATH}"  postflight-job
}

function buildMariaDb {
  echo
  echo "-- Building/publishing MariaDB"
  # Download and retag image to save bandwidth
  buildAndPublishImage stratos-dc-mariadb Dockerfile.mariadb "${STRATOS_PATH}/deploy/db"
}

function buildUI {
  # Build and push an image based on the nginx container
  echo
  echo "-- Building/publishing the runtime container image for the Console web server"
  # Download and retag image to save bandwidth
  buildAndPublishImage stratos-dc-console deploy/Dockerfile.ui "${STRATOS_PATH}" prod-build
}

# MAIN ------------------------------------------------------
#

# Set the path to the portal proxy
STRATOS_PATH="${STRATOS_PATH}"

# cleanup output, intermediate artifacts
cleanup

# Build all of the components that make up the Console
buildProxy
buildDbMigratorJob
buildUI
buildMariaDb

# Done
echo
echo "Build complete...."

if [ "${NO_PUSH}" == "false" ]; then
  echo "Registry: ${DOCKER_REGISTRY}"
  echo "Org: ${DOCKER_ORG}"
fi

echo "Tag: ${TAG}"
