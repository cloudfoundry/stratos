#!/usr/bin/env bash

#####
#
# Use this script to locally build the Images and Helm Chart
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
DOCKER_REGISTRY=docker.io
DOCKER_ORG=splatform
BASE_IMAGE_TAG=leap15_1
OFFICIAL_TAG=cap
TAG=$(date -u +"%Y%m%dT%H%M%SZ")
ADD_OFFICIAL_TAG="false"
TAG_LATEST="false"
NO_PUSH="true"
DOCKER_REG_DEFAULTS="true"
CHART_ONLY="false"
ADD_GITHASH_TO_TAG="true"
HAS_CUSTOM_BUILD="false"
PACKAGE_CHART="false"

while getopts ":ho:r:t:Tclb:Opcnz" opt; do
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
    O)
      ADD_OFFICIAL_TAG="true"
      ;;
    l)
      TAG_LATEST="true"
      ;;
    p)
      NO_PUSH="false"
      ;;      
    c)
      CHART_ONLY="true"
      ;;     
    n)
      ADD_GITHASH_TO_TAG="false"
      ;;
    z)
      PACKAGE_CHART="true"
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
echo "== Stratos Image and Helm Chart build                                    =="
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

# Copy values template
__DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRATOS_PATH=${__DIRNAME}/../../
source "${STRATOS_PATH}/deploy/common-build.sh"

if [ -f "${STRATOS_PATH}/deploy/kubernetes/custom/custom-build.sh" ]; then
  source "${STRATOS_PATH}/deploy/kubernetes/custom/custom-build.sh"
  HAS_CUSTOM_BUILD="true"
fi

function patchAndPushImage {
  NAME=${1}
  DOCKER_FILE="${2}"
  FOLDER="${3}"
  TARGET=${4:-none}
  PATCHED_DOCKER_FILE="${DOCKER_FILE}.patched"

  patchDockerfile "${DOCKER_FILE}" "${FOLDER}"
  buildAndPublishImage ${NAME} "${PATCHED_DOCKER_FILE}" "${FOLDER}" ${TARGET}

  rm -rf "${FOLDER}/${PATCHED_DOCKER_FILE}"
  rm -rf "${FOLDER}/${PATCHED_DOCKER_FILE}.bak"
}

function patchDockerfile {
  DOCKER_FILE="${1}"
  FOLDER="${2}"
  PATCHED_DOCKER_FILE="${DOCKER_FILE}.patched"

  # Replace registry/organization
  pushd "${FOLDER}" > /dev/null 2>&1
  ls
  rm -rf "${PATCHED_DOCKER_FILE}"
  cp "${DOCKER_FILE}" "${PATCHED_DOCKER_FILE}"
  if [ "${DOCKER_REG_DEFAULTS}" == "false" ]; then
    sed -i.bak "s@splatform@${DOCKER_REGISTRY}/${DOCKER_ORG}@g" "${FOLDER}/${PATCHED_DOCKER_FILE}"
  fi
  sed -i.bak "s/leap15_1/${BASE_IMAGE_TAG}/g" "${FOLDER}/${PATCHED_DOCKER_FILE}"
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
if [ "${CHART_ONLY}" == "false" ]; then
  cleanup
fi

# Clean any old patched docker files left if previously errored
# rm -rf ${STRATOS_PATH}/deploy/Dockerfile.*.patched
# rm -rf ${STRATOS_PATH}/deploy/Dockerfile.*.bak
# rm -rf ${STRATOS_PATH}/deploy/Dockerfile.*.patched.bak

if [ "${ADD_GITHASH_TO_TAG}" == "true" ]; then
  updateTagForRelease
fi

if [ "${CHART_ONLY}" == "false" ]; then

  # Build all of the components that make up the Console

  log "-- Build & publish the runtime container image for Jetstream (backend)"
  patchAndPushImage stratos-jetstream deploy/Dockerfile.bk "${STRATOS_PATH}" prod-build

  log "-- Build & publish the runtime container image for Install Config Job"
  patchAndPushImage stratos-config-init deploy/Dockerfile.init "${STRATOS_PATH}"

  # Build and push an image based on the mariab db container
  log "-- Building/publishing MariaDB"
  patchAndPushImage stratos-mariadb Dockerfile.mariadb "${STRATOS_PATH}/deploy/db"

  # Build and push an image based on the nginx container (Front-end)
  log "-- Building/publishing the runtime container image for the Console web server (frontend)"
  patchAndPushImage stratos-console deploy/Dockerfile.ui "${STRATOS_PATH}" prod-build

  # Build any custom images added by a fork
  if [ "${HAS_CUSTOM_BUILD}" == "true" ]; then
    custom_image_build
  fi
fi

log "-- Building Helm Chart"

# Don't change the chart in the repo, copy it and modify it locally

SRC_HELM_CHART_PATH="${STRATOS_PATH}/deploy/kubernetes/console"
DEST_HELM_CHART_PATH="${STRATOS_PATH}/deploy/kubernetes/helm-chart"

rm -rf "${DEST_HELM_CHART_PATH}"
mkdir -p "${DEST_HELM_CHART_PATH}"
cp -R "${SRC_HELM_CHART_PATH}/." "${DEST_HELM_CHART_PATH}/"

pushd "${DEST_HELM_CHART_PATH}" > /dev/null

# Remove any .orig files
rm -rf "${DEST_HELM_CHART_PATH}/**/*.orig"

# Run customization script if there is one
# This can do things like provide a custom __stratos.tpl file
if [ -f "${STRATOS_PATH}/deploy/kubernetes/custom/customize-helm.sh" ]; then
  printf "${YELLOW}${BOLD}Applying Helm Chart customizations${RESET}\n"
  "${STRATOS_PATH}/deploy/kubernetes/custom/customize-helm.sh" "${DEST_HELM_CHART_PATH}"
fi

# Fetch subcharts
helm dependency update

# Commands:
sed -i.bak -e 's/consoleVersion: latest/consoleVersion: '"${TAG}"'/g' values.yaml
sed -i.bak -e 's/organization: splatform/organization: '"${DOCKER_ORG}"'/g' values.yaml
sed -i.bak -e 's/hostname: docker.io/hostname: '"${DOCKER_REGISTRY}"'/g' values.yaml

sed -i.bak -e 's/version: 0.1.0/version: '"${TAG}"'/g' Chart.yaml
sed -i.bak -e 's/appVersion: 0.1.0/appVersion: '"${TAG}"'/g' Chart.yaml

# Patch the console image tag in place - otherwise --reuse-values won't work with helm upgrade
# Make sure we patch all files that have this reference
cd templates
find . -type f -name '*.yaml' | xargs sed -i.bak -e 's/{{.Values.consoleVersion}}/'"${TAG}"'/g'
find . -type f -name "*.bak" -delete
cd ..

rm -rf *.bak

# Generate image list
echo ${STRATOS_PATH}
"${STRATOS_PATH}/deploy/kubernetes/imagelist-gen.sh" .

popd > /dev/null

if [ "${PACKAGE_CHART}" ==  "true" ]; then
  log "Packaging Helm Chart"
  pushd "${STRATOS_PATH}/deploy/kubernetes" > /dev/null
  PKG_DIST_BASE_FOLDER=./dist
  PKG_DIST_FOLDER=./dist/${TAG}/console
  rm -rf ${PKG_DIST_BASE_FOLDER}
  mkdir -p ${PKG_DIST_BASE_FOLDER}/${TAG}
  cp -R ./helm-chart/ ${PKG_DIST_FOLDER}
  helm package ${PKG_DIST_FOLDER}
  rm -rf ${PKG_DIST_BASE_FOLDER}
  popd > /dev/null
fi

set +e

printf "${BOLD}${YELLOW}"
echo
echo "Build complete...."
printf "${CYAN}"
echo "  Registry            : ${DOCKER_REGISTRY}"
echo "  Org                 : ${DOCKER_ORG}"
echo "  Tag                 : ${TAG}"
printf "${RESET}"

echo
echo "To deploy using Helm, execute the following:"
echo 
echo "    helm install helm-chart --namespace console --name my-console"
echo
