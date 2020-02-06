#!/bin/bash

# Colours
CYAN="\033[96m"
YELLOW="\033[93m"
RED="\033[91m"
RESET="\033[0m"
BOLD="\033[1m"

# Program Paths:
PROG=$(basename ${BASH_SOURCE[0]})
PROG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRATOS_DIR="$( cd "${PROG_DIR}/.." && pwd )"

echo -e "${CYAN}${BOLD}=============================${RESET}"
echo -e "${CYAN}${BOLD}Updating Go and Node versions${RESET}"
echo -e "${CYAN}${BOLD}=============================${RESET}"

echo -e "${YELLOW}Stratos Directory: ${STRATOS_DIR}${RESET}"
echo ""

# Current versions that we should be using
GO_VERSION=1.13.4
NODE_VERSION=12.13.0

echo -e "${YELLOW}Go Version  : ${GO_VERSION}${RESET}"
echo -e "${YELLOW}Node Version: ${NODE_VERSION}${RESET}"

function checkVersion() {

  FILE=$1
  DESC=$2
  EXISTS=$3
  REPLACE=$4

  if [ ! -f "$FILE" ]; then
    echo -e "${RED}Error: File $FILE does not exist${RESET}"
  fi

  echo -e "${CYAN}  ${FILE}${RESET}"
  sed -i.bak -e 's/'"$REPLACE"'/'"$EXISTS"'/g' ${FILE}
}

# Check versions in the various files that we have

echo ""
echo -e "${YELLOW}Patching files:${RESET}"

# Go Version

checkVersion "${STRATOS_DIR}/deploy/stratos-base-images/Dockerfile.stratos-go-build-base.tmpl" "Go Builder Base Image" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkVersion "${STRATOS_DIR}/.travis.yml" "Travis file" "(gimme ${GO_VERSION})" "(gimme [0-9\.]*)"
checkVersion "${STRATOS_DIR}/deploy/ci/travis/depcache.sh" "Depcache generation script" "gimme ${GO_VERSION}" "gimme [0-9\.]*"
checkVersion "${STRATOS_DIR}/deploy/fissile/Dockerfile.bosh-cli" "BOSH Release Dockerfile" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkVersion "${STRATOS_DIR}/deploy/ci/scripts/Dockerfile.bosh" "BOSH Dockerfile" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkVersion "${STRATOS_DIR}/deploy/stratos-ui-release/config/blobs.yml" "BOSH Release config file" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkVersion "${STRATOS_DIR}/deploy/stratos-ui-release/packages/golang/packaging" "BOSH Release packaging file" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"
checkVersion "${STRATOS_DIR}/deploy/stratos-ui-release/packages/golang/spec" "BOSH Release spec file" "go${GO_VERSION}.linux" "go[0-9\.]*.linux"

# Node Version

checkVersion "${STRATOS_DIR}/deploy/stratos-base-images/Dockerfile.stratos-ui-build-base.tmpl" "UI Builder Base Image" "v${NODE_VERSION}\/node-v${NODE_VERSION}-linux" "v[0-9\.]*\/node-v[0-9\.]*-linux"
checkVersion "${STRATOS_DIR}/deploy/stratos-base-images/Dockerfile.stratos-ui-build-base.tmpl" "UI Builder Base Image 2" "node-v${NODE_VERSION}" "node-v[0-9\.]*"
checkVersion "${STRATOS_DIR}/deploy/stratos-base-images/Dockerfile.stratos-bk-build-base.tmpl" "Backend Builder Base Image" "node-v${NODE_VERSION}" "node-v[0-9\.]*"
checkVersion "${STRATOS_DIR}/deploy/stratos-base-images/Dockerfile.stratos-bk-build-base.tmpl" "Backend Builder Base Image" "v${NODE_VERSION}\/node-v${NODE_VERSION}-linux" "v[0-9\.]*\/node-v[0-9\.]*-linux"
checkVersion "${STRATOS_DIR}/.travis.yml" "Travis file" "  - \"${NODE_VERSION}\"" "  - \"[0-9\.]*\""
checkVersion "${STRATOS_DIR}/package.json" "Package file" "\"node\": \"${NODE_VERSION}\"" "\"node\": \"[0-9\.]*\""
checkVersion "${STRATOS_DIR}/docs/developers-guide.md" "Developer Guide doc" "minimum node version ${NODE_VERSION}" "minimum node version [0-9\.]*"
 
echo ""
echo -e "${YELLOW}NOTE: Please ensure you check the Go version in the Stratos Buildpack${RESET}"
echo ""
