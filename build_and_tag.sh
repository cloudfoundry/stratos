#!/bin/bash
set -eu

# set defaults
PROD_RELEASE=false
DOCKER_REGISTRY=docker.io/stackatodev
TAG=$(date -u +"%Y%m%dT%H%M%SZ")

while getopts ":hpr:t:" opt; do
  case $opt in
    h)
      echo " "
      echo "***** HOW TO USE THIS SCRIPT *****"
      echo " "
      echo "--- Normal dev/test mode requires no parameters:"
      echo " "
      echo " ./build_and_tag.sh"
      echo " "
      echo " "
      echo " This will generate a tag based on date and time and use the default HPE docker registry."
      echo " "
      echo " "
      echo "--- Cut a release of the Console: "
      echo " "
      echo " ./build_and_test.sh -p -t 1.0.13"
      echo " "
      echo " This will create a production release based on the -p flag, and will tag the release"
      echo " with a semantic version based on the version supplied via the -t flag. This version"
      echo " will be combined with the latest git commit hash from the proxy repo for the full tag."
      echo " "
      echo " For now, the choice of the version tag must be supplied when you run the script. Look"
      echo " at the last tag in the portal-proxy repo to understand what the next tag should be."
      echo " "
      exit 0
      ;;
    p)
      PROD_RELEASE=true
      ;;
    r)
      DOCKER_REGISTRY="$OPTARG"
      ;;
    t)
      TAG="$OPTARG"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

echo " "
echo "PRODUCTION BUILD/RELEASE: ${PROD_RELEASE}"
echo "REGISTRY: ${DOCKER_REGISTRY}"
echo "TAG: ${TAG}"

echo " "
echo "Starting build"

BUILD_ARGS=""
__DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#BUILD_ARGS="--build-arg http_proxy=http://proxy.sdc.hp.com:8080"
#BUILD_ARGS="$BUILD_ARGS --build-arg https_proxy=http://proxy.sdc.hp.com:8080"

function buildAndPublishImage {
  NAME=$1
  DOCKER_FILE=$2
  FOLDER=$3

  if [ ! -d "${FOLDER}" ]; then
    echo "Project ${FOLDER} hasn't been checked out";
    exit 1
  fi

  # IMAGE_URL=${DOCKER_REGISTRY}/${NAME}:${TAG}
  IMAGE_URL=${DOCKER_REGISTRY}/${NAME}:${TAG}
  echo Building Docker Image for $NAME

  pushd ${FOLDER}
  pwd
  docker build ${BUILD_ARGS} -t $NAME -f $DOCKER_FILE .

  docker tag ${NAME} ${IMAGE_URL}

  echo Pushing Docker Image ${IMAGE_URL}
  docker push  ${IMAGE_URL}
  popd
}

function cleanup {
  # Cleanup the SDL/instance defs
  echo " "
  echo "-- Cleaning up ${__DIRNAME}/output/*"
  rm -rf ${__DIRNAME}/output/*

  # Cleanup prior to generating the UI container
  echo " "
  echo "-- Cleaning up ${__DIRNAME}/../stratos-ui/dist"
  rm -rf ${__DIRNAME}/../stratos-ui/dist
  echo " "
  echo "-- Cleaning up ${__DIRNAME}/../stratos-ui/containers/nginx/dist"
  rm -rf ${__DIRNAME}/../stratos-ui/containers/nginx/dist
}

function checkTag {
  pushd ${PORTAL_PROXY_PATH}
  TAG_EXISTS=$(git tag -l "$TAG*")
  case "$TAG_EXISTS" in
    "")
    ;;
    *)
    echo " "
    echo "Tag already exists in the portal-proxy git repo. Try again with a new tag."
    exit 1
    ;;
  esac
  popd
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
  pushd ${PORTAL_PROXY_PATH}
  GIT_HASH=$(git rev-parse --short HEAD)
  echo "GIT_HASH: $GIT_HASH"
  TAG="$TAG-0-g$GIT_HASH"
  echo "New TAG: $TAG"
  popd
}

function checkMasterBranch {
  LOCATION=$1
  pushd $LOCATION

  # Ensure we are on master branch
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ ! "$BRANCH" == "master" ]; then
    echo " "
    echo "You must be on the master branch of all repos in order to cut a release. $LOCATION is on $BRANCH branch."
    exit 1
  fi

  # Ensure we are up to date with master branch
  COMMITS=$(git rev-list HEAD...origin/master --count)
  if [ ! "$COMMITS" == "0" ]; then
    echo " "
    echo "Your local master branch appears to be out of sync with upstream: $LOCATION "
    exit 1
  fi

  popd
}

function pushGitTag {
  LOCATION=$1
  echo "LOCATION: $LOCATION"
  pushd $LOCATION
  # Create a local tag
  git tag "$TAG"
  # Push the tag to the shared repo
  git push origin "$TAG"
  popd
}

function buildProxy {
  # Use the existing build container to compile the proxy executable, and leave
  # it on the local filesystem.
  echo " "
  echo "-- Building the Console Proxy"

  # For production release, ensure we are on the master branch
  if [ "$PROD_RELEASE" == true ]; then
    checkMasterBranch ${PORTAL_PROXY_PATH}
  fi

  echo " "
  echo "-- Run the build container to build the proxy executable"

  pushd ${PORTAL_PROXY_PATH}
  pushd $(git rev-parse --show-toplevel)
  docker run -e "APP_VERSION=${TAG}" \
             -it \
             --rm \
             --name hsc-console-proxy-builder \
             --volume $(pwd):/go/src/github.com/hpcloud/portal-proxy \
             ${DOCKER_REGISTRY}/hsc-console-proxy-builder
  popd
  popd

  # Copy the previously compiled executable into the container and
  # publish the container image for the portal proxy
  echo " "
  echo "-- Build & publish the runtime container image for the Console Proxy"
  buildAndPublishImage hsc-proxy Dockerfile.HCP ${PORTAL_PROXY_PATH}
}

function buildETCD {
  # Build and publish the container image for etcd
  echo " "
  echo "-- Build & publish the runtime container image for etcd"
  buildAndPublishImage hsc-etcd2 ./containers/etcd2/Dockerfile.HCP ${PORTAL_PROXY_PATH}
}

function buildStolon {
  # Build and publish the container image for stolon
  echo " "
  echo "-- Build & publish the runtime container image for stolon"
  buildAndPublishImage hsc-stolon ./containers/stolon/Dockerfile.HCP ${PORTAL_PROXY_PATH}
}

function buildPreflightJob {
  # Build the preflight container
  echo " "
  echo "-- Build & publish the runtime container image for the preflight job"
  buildAndPublishImage hsc-preflight-job ./db/Dockerfile.preflight-job.HCP ${PORTAL_PROXY_PATH}
}

function buildPostflightJob {
  # Build the postflight container
  echo " "
  echo "-- Build & publish the runtime container image for the postflight job"
  buildAndPublishImage hsc-postflight-job ./db/Dockerfile.postflight-job.HCP ${PORTAL_PROXY_PATH}
}

function buildUI {
  # For production release, ensure we are on the master branch
  if [ "$PROD_RELEASE" == true ]; then
    checkMasterBranch ${__DIRNAME}/../stratos-ui
    checkMasterBranch ${__DIRNAME}/../helion-ui-framework
  fi

  # Prepare the nginx server
  echo " "
  echo "-- Provision the UI"
  docker run --rm \
    -v ${__DIRNAME}/../stratos-ui:/usr/src/app \
    -v ${__DIRNAME}/../helion-ui-framework:/usr/src/helion-ui-framework \
    -w /usr/src/app \
    node:4.2.3 \
    /bin/bash ./provision.sh

  # Copy the artifacts from the above to the nginx container
  echo " "
  echo "-- Copying the Console UI artifacts to the web server (nginx) container"
  cp -R ${__DIRNAME}/../stratos-ui/dist ${__DIRNAME}/../stratos-ui/containers/nginx/dist

  # Build and push an image based on the nginx container
  echo " "
  echo "-- Building/publishing the runtime container image for the Console web server"
  buildAndPublishImage hsc-console Dockerfile.HCP ${__DIRNAME}/../stratos-ui/containers/nginx
}

function generateSDL {
  # For production release, ensure we are on the master branch
  if [ "$PROD_RELEASE" == true ]; then
    checkMasterBranch ${__DIRNAME}
  fi

  echo " "
  echo "-- Creating upgrade config, service & instance definitions"
  mkdir -p ${__DIRNAME}/output
  for FILE in ${__DIRNAME}/hcp_templates/*.json ; do
    ofile=${__DIRNAME}/output/$(basename $FILE)
    cat $FILE | sed s~{{TAG}}~${TAG}~g | sed -r s~{{REGISTRY}}~${DOCKER_REGISTRY}~g > $ofile
  done
  echo "-- Done."
}

#
# MAIN ------------------------------------------------------
#

# Set the path to the portal proxy
PORTAL_PROXY_PATH=$GOPATH/src/github.com/hpcloud/portal-proxy

# cleanup output, intermediate artifacts
cleanup

# If this is a prod release:
#   check the tag to be sure it hasn't been used before
#   generate a new standard Console release tag
if [ "$PROD_RELEASE" == true ]; then
  checkTag
  updateTagForRelease
fi

# Build all of the components that make up the Console
buildProxy
buildETCD
buildStolon
buildPreflightJob
buildPostflightJob
buildUI

# Generate definitions
generateSDL

if [ "$PROD_RELEASE" == true ]; then
  echo " "
  echo "-- Tag the portal-proxy GitHub repo"
  pushGitTag ${PORTAL_PROXY_PATH}

  echo " "
  echo "-- Tag the stratos-ui GitHub repo "
  pushGitTag ${__DIRNAME}/../stratos-ui

  echo " "
  echo "-- Tag the helion-ui-framework GitHub repo "
  pushGitTag ${__DIRNAME}/../helion-ui-framework

  echo " "
  echo "-- Tag the stratos-deploy GitHub repo"
  pushGitTag ${__DIRNAME}
fi

# TBD - automate the creation of a new PR against catalog-templates repo
#       see the HCP repo for an example.

# Done
echo " "
echo "Build complete. Tag is $TAG and HCP definitions are in ${__DIRNAME}/output/"
echo "The definitions are using registry: $DOCKER_REGISTRY and tag: $TAG"
