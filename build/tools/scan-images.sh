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
STRATOS_DIR="$( cd "${PROG_DIR}/../.." && pwd )"

echo -e "${CYAN}${BOLD}=========================${RESET}"
echo -e "${CYAN}${BOLD}Scanning Container Images${RESET}"
echo -e "${CYAN}${BOLD}=========================${RESET}"

echo -e "${YELLOW}Stratos Directory: ${STRATOS_DIR}${RESET}"
echo ""



function count_severity() {
  local IMAGE=$1
  local SEVERITY=$2

  COUNT=$(grep -c '\"Severity\": \"'${SEVERITY}'\"' $IMAGE)
  echo -e " $SEVERITY: $COUNT"
}

function scan_image() {
  local REG=$1
  local IMAGE=$2
  echo -e "${CYAN}${BOLD}Scanning image: ${REG}/${IMAGE}${RESET}"
  trivy image --no-progress -f json -o $IMAGE.json $REG/$IMAGE > $IMAGE.log
  echo $?
  count_severity $IMAGE.json "CRITICAL"
  count_severity $IMAGE.json "HIGH"
  count_severity $IMAGE.json "MEDIUM"
  count_severity $IMAGE.json "LOW"
}

function scan_helm() {
  # URL of a Stratos Helm Chart
  local TEMP_DIR=${STRATOS_DIR}/scan_tmp
  rm -rf ${TEMP_DIR}
  mkdir -p ${TEMP_DIR}
  pushd ${TEMP_DIR} > /dev/null

  wget -O chart.tgz $1
  tar -xzvf chart.tgz

  ORG=$(grep -oP "organization: \K.*" console/values.yaml)
  REG=$(grep -oP "hostname: \K.*" console/values.yaml)

  local REGISTRY=$REG/$ORG
  echo -e "${YELLOW}Registry: ${REGISTRY}${RESET}"
  while IFS= read -r line
  do
    scan_image $REGISTRY $line
  done < "./console/imagelist.txt"
  popd > /dev/null
}

function scan_base_images() {
  echo "Scanning base images ..."
  local TEMP_DIR=${STRATOS_DIR}/scan_tmp
  rm -rf ${TEMP_DIR}
  mkdir -p ${TEMP_DIR}
  pushd ${TEMP_DIR} > /dev/null
  local REGISTRY=$1
  echo -e "${YELLOW}Registry: ${REGISTRY}${RESET}"
  cat ${STRATOS_DIR}/deploy/stratos-base-images/imagelist.txt
  while IFS= read -r line
  do
    scan_image $REGISTRY $line
  done < "${STRATOS_DIR}/deploy/stratos-base-images/imagelist.txt"
  popd > /dev/null
}

if [ "$1" == "helm" ]; then
  scan_helm $2
elif [ "$1" == "base" ]; then
  scan_base_images $2
else
  echo "Unknown command"
fi