#!/usr/bin/env bash
set -eu

# set defaults
DOCKER_REGISTRY=docker.io
DOCKER_ORG=splatform

TAG=$(date -u +"%Y%m%dT%H%M%SZ")

STRATOS_BOWER=""
NO_PUSH="false"

while getopts ":ho:r:t:lu:n" opt; do
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
    u)
      STRATOS_BOWER="${OPTARG}"
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
__DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRATOS_UI_PATH=${__DIRNAME}/../../

# Proxy support
BUILD_ARGS=""
RUN_ARGS=""
if [ -n "${http_proxy:-}" -o -n "${HTTP_PROXY:-}" ]; then
  BUILD_ARGS="${BUILD_ARGS} --build-arg http_proxy=${http_proxy:-${HTTP_PROXY}}"
  RUN_ARGS="${RUN_ARGS} -e http_proxy=${http_proxy:-${HTTP_PROXY}}"
fi
if [ -n "${https_proxy:-}" -o -n "${HTTPS_PROXY:-}" ]; then
  BUILD_ARGS="${BUILD_ARGS} --build-arg https_proxy=${https_proxy:-${HTTPS_PROXY}}"
  RUN_ARGS="${RUN_ARGS} -e https_proxy=${https_proxy:-${HTTPS_PROXY}}"
fi

# Trim leading/trailing whitespace
BUILD_ARGS="$(echo -e "${BUILD_ARGS}" | sed -r -e 's@^[[:space:]]*@@' -e 's@[[:space:]]*$@@')"
RUN_ARGS="$(echo -e "${RUN_ARGS}" | sed -r -e 's@^[[:space:]]*@@' -e 's@[[:space:]]*$@@')"

if [ -n "${BUILD_ARGS}" ]; then
  echo "Web Proxy detected from environment. Running Docker with:"
  echo -e "- BUILD_ARGS:\t'${BUILD_ARGS}'"
  echo -e "- RUN_ARGS:\t'${RUN_ARGS}'"
fi

function preloadImage {
  docker pull ${DOCKER_REGISTRY}/$1
  docker tag ${DOCKER_REGISTRY}/$1 $1
}

function buildAndPublishImage {
  NAME=${1}
  DOCKER_FILE=${2}
  FOLDER=${3}
  TARGET=${4:-none}

  if [ ! -d "${FOLDER}" ]; then
    echo "Project ${FOLDER} hasn't been checked out";
    exit 1
  fi

  IMAGE_URL=${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:${TAG}
  echo Building Docker Image for ${NAME}

  pushd ${FOLDER} > /dev/null 2>&1
  pwd

  SET_TARGET=""
  if [ "${TARGET}" != "none" ]; then
    SET_TARGET="--target=${TARGET}"
  fi

  docker build ${BUILD_ARGS} ${SET_TARGET} -t $NAME -f $DOCKER_FILE .
  docker tag ${NAME} ${IMAGE_URL}

  if [ "${NO_PUSH}" = "false" ]; then
    echo Pushing Docker Image ${IMAGE_URL}
    docker push  ${IMAGE_URL}
  fi

  if [ "${TAG_LATEST}" = "true" ]; then
    docker tag ${IMAGE_URL} ${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:latest
    if [ "${NO_PUSH}" = "false" ]; then
      echo Pushing Docker Image ${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:latest
      docker push ${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:latest
    fi
  fi

  # Update values.yaml

  popd > /dev/null 2>&1
}

function cleanup {
  # Cleanup the SDL/instance defs
  echo
  echo "-- Cleaning up older values.yaml"
  rm -f values.yaml
  # Cleanup prior to generating the UI container
  echo
  echo "-- Cleaning up ${STRATOS_UI_PATH}"
  rm -rf ${STRATOS_UI_PATH}/dist
  rm -rf ${STRATOS_UI_PATH}/node_modules
  echo
  echo "-- Cleaning up ${STRATOS_UI_PATH}/deploy/containers/nginx/dist"
  rm -rf ${STRATOS_UI_PATH}/deploy/containers/nginx/dist

}

function updateTagForRelease {
  # Reset the TAG variable for a release to be of the form:
  #   <version>-<commit#>-<prefix><hash>
  #   where:
  #     <version> = semantic, in the form major#.minor#.patch#
  #     <commit#> = number of commits since tag - always 0
  #     <prefix> = git commit prefix - always 'g'
  #     <hash> = git commit hash for the current branch
  # Reference: See the examples section here -> https://git-scm.com/docs/git-describe
  pushd ${STRATOS_UI_PATH} > /dev/null 2>&1
  GIT_HASH=$(git rev-parse --short HEAD)
  echo "GIT_HASH: ${GIT_HASH}"
  TAG="${TAG}-0-g${GIT_HASH}"
  echo "New TAG: ${TAG}"
  popd > /dev/null 2>&1
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


function buildProxy {
  echo
  echo "-- Building the Stratos Backend"

  echo
  echo "-- Build & publish the runtime container image for the Console Proxy"
  buildAndPublishImage stratos-proxy deploy/Dockerfile.bk ${STRATOS_UI_PATH} prod-build
}

function buildPostflightJob {
  # Build the postflight container
  echo
  echo "-- Build & publish the runtime container image for the postflight job"
  buildAndPublishImage stratos-postflight-job deploy/Dockerfile.bk ${STRATOS_UI_PATH}  postflight-job
}

function buildMariaDb {
  echo
  echo "-- Building/publishing MariaDB"
  # Download and retag image to save bandwidth
  buildAndPublishImage stratos-mariadb Dockerfile.mariadb ${STRATOS_UI_PATH}/deploy/db
}

function buildUI {
  # Build and push an image based on the nginx container
  echo
  echo "-- Building/publishing the runtime container image for the Console web server"
  # Download and retag image to save bandwidth
  buildAndPublishImage stratos-console deploy/Dockerfile.ui ${STRATOS_UI_PATH} prod-build
}

# MAIN ------------------------------------------------------
#

# Set the path to the portal proxy
STRATOS_UI_PATH=${STRATOS_UI_PATH}

# cleanup output, intermediate artifacts
cleanup

updateTagForRelease

# Build all of the components that make up the Console
buildProxy
buildPostflightJob
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
