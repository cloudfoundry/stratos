#!/bin/bash
set -eu

# set defaults
PROD_RELEASE=false
DOCKER_REGISTRY=docker.io
DOCKER_ORG=stackatodev
TAG=$(date -u +"%Y%m%dT%H%M%SZ")

while getopts ":hopr:t:" opt; do
  case $opt in
    h)
      echo
      echo "***** HOW TO USE THIS SCRIPT *****"
      echo
      echo "--- Normal dev/test mode requires no parameters:"
      echo
      echo " ./build_and_tag.sh"
      echo
      echo
      echo " This will generate a tag based on date and time and use the default HPE docker registry."
      echo
      echo
      echo "--- Cut a release of the Console: "
      echo
      echo " ./build_and_test.sh -p -t 1.0.13"
      echo
      echo " This will create a production release based on the -p flag, and will tag the release"
      echo " with a semantic version based on the version supplied via the -t flag. This version"
      echo " will be combined with the latest git commit hash from the proxy repo for the full tag."
      echo " "
      echo " For now, the choice of the version tag must be supplied when you run the script. Look"
      echo " at the last tag in the portal-proxy repo to understand what the next tag should be."
      echo
      exit 0
      ;;
    p)
      PROD_RELEASE=true
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

echo
echo "Starting build"


__DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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

function buildAndPublishImage {
  NAME=${1}
  DOCKER_FILE=${2}
  FOLDER=${3}

  if [ ! -d "${FOLDER}" ]; then
    echo "Project ${FOLDER} hasn't been checked out";
    exit 1
  fi

  IMAGE_URL=${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:${TAG}
  echo Building Docker Image for ${NAME}

  pushd ${FOLDER} > /dev/null 2>&1
  pwd
  docker build ${BUILD_ARGS} -t $NAME -f $DOCKER_FILE .

  docker tag ${NAME} ${IMAGE_URL}

  echo Pushing Docker Image ${IMAGE_URL}
  docker push  ${IMAGE_URL}
  popd > /dev/null 2>&1
}

function cleanup {
  # Cleanup the SDL/instance defs
  echo
  echo "-- Cleaning up ${__DIRNAME}/output/*"
  rm -rf ${__DIRNAME}/output/*

  # Cleanup prior to generating the UI container
  echo
  echo "-- Cleaning up ${__DIRNAME}/../stratos-ui"
  rm -rf ${__DIRNAME}/../stratos-ui/dist
  rm -rf ${__DIRNAME}/../stratos-ui/tools/node_modules
  rm -rf ${__DIRNAME}/../stratos-ui/src/lib
  echo
  echo "-- Cleaning up ${__DIRNAME}/../stratos-ui/containers/nginx/dist"
  rm -rf ${__DIRNAME}/../stratos-ui/containers/nginx/dist
}

function checkTag {
  pushd ${PORTAL_PROXY_PATH} > /dev/null 2>&1
  TAG_EXISTS=$(git tag -l "${TAG}*")
  case "${TAG_EXISTS}" in
    "")
    ;;
    *)
    echo
    echo "Tag already exists in the portal-proxy git repo. Try again with a new tag."
    exit 1
    ;;
  esac
  popd > /dev/null 2>&1
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
  pushd ${PORTAL_PROXY_PATH} > /dev/null 2>&1
  GIT_HASH=$(git rev-parse --short HEAD)
  echo "GIT_HASH: ${GIT_HASH}"
  TAG="${TAG}-0-g${GIT_HASH}"
  echo "New TAG: ${TAG}"
  popd > /dev/null 2>&1
}

function checkMasterBranch {
  pushd ${1} > /dev/null 2>&1
  LOCATION=$(pwd -P)

  echo -e "Checking git repository is clean and up to date: \0033[33m${LOCATION}\033[0m"

  # Allow git commands to fail
  set +e

  # Ensure we are on master branch
  echo -en "\tChecking repo is on master..."
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "${BRANCH}" != "master" ]; then
    echo >&2 -e "\n\033[31mYou must be on the master branch of all repos in order to cut a production release.\033[0m"
    echo >&2 -e "But ${LOCATION} is on the \033[31m'${BRANCH}'\033[0m branch instead."
    exit 1
  fi
  echo -e "\0033[32m [OK]\033[0m"

  # Ensure the index is up to date before checking for uncommitted changes
  git update-index --refresh > /dev/null 2>&1

  # Disallow unstaged changes in the working tree
  echo -en "\tChecking there are no unstaged changes..."
  if ! git diff-files --quiet --ignore-submodules --; then
    echo >&2 -e "\n\033[31mYou must not have unstaged changes in ${LOCATION}\033[0m"
    git diff-files --name-status -r --ignore-submodules -- >&2
    exit 1
  fi
  echo -e "\0033[32m [OK]\033[0m"

  # Disallow uncommitted changes in the index
  echo -en "\tChecking there are no uncommitted changes..."
  if ! git diff-index --cached --quiet HEAD --ignore-submodules --; then
    echo >&2 -e "\n\033[31mYou must not have uncommitted changes in ${LOCATION}\033[0m"
    git diff-index --cached --name-status -r --ignore-submodules HEAD -- >&2
    exit 1
  fi
  echo -e "\0033[32m [OK]\033[0m"

  # Disallow untracked files
  echo -en "\tChecking there are no untracked files..."
  if [ $(git ls-files --exclude-standard --others --| wc -l) -ne 0 ]; then
    echo >&2 -e "\n\033[31mYou must not have untracked files in ${LOCATION}\033[0m"
    git status >&2
    exit 1
  fi
  echo -e "\0033[32m [OK]\033[0m"

  echo -en "\tChecking that your local master branch is up to date with upstream..."
  # Ensure our remote is fetched
  git fetch origin master > /dev/null 2>&1

  # Ensure we are up to date with master branch
  COMMITS=$(git rev-list HEAD...origin/master --count)
  if [ ${COMMITS} -ne 0 ]; then
    echo >&2 -e "\n\033[31mYour local master branch is out of sync with upstream: ${LOCATION}\033[0m"
    exit 1
  fi
  echo -e "\0033[32m [OK]\033[0m"

  set -e
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
  # Use the existing build container to compile the proxy executable, and leave
  # it on the local filesystem.
  echo
  echo "-- Building the Console Proxy"

  echo
  echo "-- Run the build container to build the proxy executable"

  pushd ${PORTAL_PROXY_PATH} > /dev/null 2>&1
  pushd $(git rev-parse --show-toplevel) > /dev/null 2>&1

  docker run -e "APP_VERSION=${TAG}" \
             ${RUN_ARGS} \
             -it \
             --rm \
             --name hsc-console-proxy-builder \
             --volume $(pwd):/go/src/github.com/hpcloud/portal-proxy \
             ${DOCKER_REGISTRY}/${DOCKER_ORG}/hsc-console-proxy-builder
  popd > /dev/null 2>&1
  popd > /dev/null 2>&1

  # Copy the previously compiled executable into the container and
  # publish the container image for the portal proxy
  echo
  echo "-- Build & publish the runtime container image for the Console Proxy"
  buildAndPublishImage hsc-proxy Dockerfile.HCP ${PORTAL_PROXY_PATH}
}

function buildPostgres {
  # Build and publish the container image for postgres
  echo
  echo "-- Build & publish the runtime container image for postgres"
  buildAndPublishImage hsc-postgres ./containers/postgres/Dockerfile.HCP ${PORTAL_PROXY_PATH}
}

function buildPreflightJob {
  # Build the preflight container
  echo
  echo "-- Build & publish the runtime container image for the preflight job"
  buildAndPublishImage hsc-preflight-job ./db/Dockerfile.preflight-job.HCP ${PORTAL_PROXY_PATH}
}

function buildPostflightJob {
  # Build the postflight container
  echo
  echo "-- Build & publish the runtime container image for the postflight job"
  buildAndPublishImage hsc-postflight-job ./db/Dockerfile.postflight-job.HCP ${PORTAL_PROXY_PATH}
}

function buildUI {
  # Prepare the nginx server
  echo
  echo "-- Provision the UI"
  docker run --rm \
    ${RUN_ARGS} \
    -v ${__DIRNAME}/../stratos-ui:/usr/src/app \
    -v ${__DIRNAME}/../helion-ui-framework:/usr/src/helion-ui-framework \
    -w /usr/src/app \
    node:6.9.1 \
    /bin/bash ./provision.sh

  # Copy the artifacts from the above to the nginx container
  echo
  echo "-- Copying the Console UI artifacts to the web server (nginx) container"
  cp -R ${__DIRNAME}/../stratos-ui/dist ${__DIRNAME}/../stratos-ui/containers/nginx/dist

  # Build and push an image based on the nginx container
  echo
  echo "-- Building/publishing the runtime container image for the Console web server"
  buildAndPublishImage hsc-console Dockerfile.HCP ${__DIRNAME}/../stratos-ui/containers/nginx
}

function generateSDL {
  echo
  echo "-- Creating upgrade config, service & instance definitions"
  mkdir -p ${__DIRNAME}/output
  for FILE in ${__DIRNAME}/hcp_templates/*.json ; do
    ofile=${__DIRNAME}/output/$(basename ${FILE})
    cat ${FILE} | sed "s@{{TAG}}@${TAG}@" | sed "s@{{REGISTRY}}@${DOCKER_REGISTRY}@" | sed "s@{{ORG}}@${DOCKER_ORG}@" > ${ofile}
  done
  echo "-- Done."
}

#
# MAIN ------------------------------------------------------
#

# Set the path to the portal proxy
PORTAL_PROXY_PATH=${GOPATH}/src/github.com/hpcloud/portal-proxy

# cleanup output, intermediate artifacts
cleanup

# If this is a prod release:
#   check the tag to be sure it hasn't been used before
#   generate a new standard Console release tag
if [ "${PROD_RELEASE}" == true ]; then
  checkTag
  updateTagForRelease
  # Check all git repositories
  checkMasterBranch ${__DIRNAME}
  checkMasterBranch ${PORTAL_PROXY_PATH}
  checkMasterBranch ${__DIRNAME}/../stratos-ui
  checkMasterBranch ${__DIRNAME}/../helion-ui-framework
fi

# Build all of the components that make up the Console
buildProxy
buildPostgres
buildPreflightJob
buildPostflightJob
buildUI

# Generate definitions
generateSDL

if [ "${PROD_RELEASE}" == true ]; then
  echo
  echo "-- Tag the portal-proxy GitHub repo"
  pushGitTag ${PORTAL_PROXY_PATH}

  echo
  echo "-- Tag the stratos-ui GitHub repo "
  pushGitTag ${__DIRNAME}/../stratos-ui

  echo
  echo "-- Tag the helion-ui-framework GitHub repo "
  pushGitTag ${__DIRNAME}/../helion-ui-framework

  echo
  echo "-- Tag the stratos-deploy GitHub repo"
  pushGitTag ${__DIRNAME}
fi

# TBD - automate the creation of a new PR against catalog-templates repo
#       see the HCP repo for an example.

# Done
echo
echo "Build complete...."
echo "Registry: ${DOCKER_REGISTRY}"
echo "Org: ${DOCKER_ORG}"
echo "Tag: ${TAG}"
echo "SDL and config are located in ${__DIRNAME}/output/"
echo
