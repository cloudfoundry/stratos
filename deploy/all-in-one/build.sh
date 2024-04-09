#!/usr/bin/env bash

#####
#
# Use this script to build the All-in-one image
#
# Note: This is not used by Concourse
#
#####

set -u

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

# Set defaults
PROD_RELEASE=false
DOCKER_REGISTRY=ghcr.io
DOCKER_ORG=anynines
BASE_IMAGE_TAG=centos7
TAG=$(date -u +"%Y%m%dT%H%M%SZ")
ADD_OFFICIAL_TAG="false"
TAG_LATEST="false"
NO_PUSH="true"
DOCKER_REG_DEFAULTS="true"
HAS_CUSTOM_BUILD="false"
EXTRA_BUILD_ARGS=""

while getopts ":ho:r:t:Tlb:Opu" opt; do
  case $opt in
    h)
      echo
      echo "--- To build images of Stratos: "
      echo
      echo " ./build.sh -t 1.0.13"
      echo
      echo "-p to push images"
      exit 0
      ;;
    r)
      DOCKER_REGISTRY="${OPTARG}"
      DOCKER_REG_DEFAULTS="false"
      ;;
    o)
      DOCKER_ORG="${OPTARG}"
      DOCKER_REG_DEFAULTS="false"
      ;;
    t)
      TAG="${OPTARG}"
      ;;
    b)
      BASE_IMAGE_TAG="${OPTARG}"
      ;;
    T)
      TAG="$(git describe $(git rev-list --tags --max-count=1))"
      ;;
    l)
      TAG_LATEST="true"
      ;;
    p)
      NO_PUSH="false"
      ;;      
    u)
      EXTRA_BUILD_ARGS="--build-arg USE_PREBUILT_UI=true"
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
printf "${CYAN}${BOLD}"

echo "==========================================================================="
echo "== Stratos All-in-one build                                              =="
echo "==========================================================================="

printf "${RESET}${CYAN}"
echo
echo "PRODUCTION BUILD/RELEASE : ${PROD_RELEASE}"
echo "REGISTRY                 : ${DOCKER_REGISTRY}"
echo "ORG                      : ${DOCKER_ORG}"
echo "TAG                      : ${TAG}"
echo "BASE_IMAGE_TAG           : ${BASE_IMAGE_TAG}"

printf "${RESET}"
echo

if [ "${NO_PUSH}" != "false" ]; then
  printf "${YELLOW}Images will ${BOLD}NOT${RESET}${YELLOW} be pushed${RESET}\n"
else
  printf "${YELLOW}${BOLD}Images will be pushed${RESET}\n"
  echo "  REGISTRY : ${DOCKER_REGISTRY}"
  echo "  ORG      : ${DOCKER_ORG}"
fi

echo
printf "${CYAN}${BOLD}Starting build${RESET}\n"
echo

function log {
  set +e
  printf "${BOLD}${YELLOW}"
  echo
  echo "==========================================================================="
  echo "$1"
  echo "==========================================================================="
  echo
  printf "${RESET}"
  set -e
}

set -e

__DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRATOS_PATH=${__DIRNAME}/../../
source ${STRATOS_PATH}/deploy/common-build.sh

function patchAndPushImage {
  NAME=${1}
  DOCKER_FILE=${2}
  FOLDER=${3}
  TARGET=${4:-none}
  PATCHED_DOCKER_FILE="${DOCKER_FILE}.patched"

  patchDockerfile ${DOCKER_FILE} ${FOLDER}
  buildAndPublishImage ${NAME} "${PATCHED_DOCKER_FILE}" ${FOLDER} ${TARGET} "${EXTRA_BUILD_ARGS}"

  rm -rf ${FOLDER}/${PATCHED_DOCKER_FILE}
  rm -rf ${FOLDER}/${PATCHED_DOCKER_FILE}.bak
}

function patchDockerfile {
  DOCKER_FILE=${1}
  FOLDER=${2}
  PATCHED_DOCKER_FILE=${DOCKER_FILE}.patched

  # Replace registry/organization
  pushd ${FOLDER} > /dev/null 2>&1
  ls
  rm -rf ${PATCHED_DOCKER_FILE}
  cp ${DOCKER_FILE} ${PATCHED_DOCKER_FILE}
  if [ "${DOCKER_REG_DEFAULTS}" == "false" ]; then
    sed -i.bak "s@splatform@${DOCKER_REGISTRY}/${DOCKER_ORG}@g" ${FOLDER}/${PATCHED_DOCKER_FILE}
  fi
  sed -i.bak "s/leap15_2/${BASE_IMAGE_TAG}/g" ${FOLDER}/${PATCHED_DOCKER_FILE}
  popd > /dev/null 2>&1
}


#
# MAIN -------------------------------------------------------------------------------------------
#

pushd "${STRATOS_PATH}" > /dev/null 2>&1
STRATOS_PATH="$(pwd)"
popd > /dev/null 2>&1
echo "Base path: ${STRATOS_PATH}"

# cleanup output, intermediate artifacts
cleanup

log "-- Build & publish the runtime container image for All-in-one"
patchAndPushImage stratos-aio deploy/Dockerfile.all-in-one "${STRATOS_PATH}"

set +e

printf "${BOLD}${YELLOW}"
echo
echo "Build complete...."
printf "${CYAN}"
echo "  Registry            : ${DOCKER_REGISTRY}"
echo "  Org                 : ${DOCKER_ORG}"
echo "  Tag                 : ${TAG}"
printf "${RESET}"
echo ""
