#!/bin/bash

echo "========================="
echo "Stratos Helm Images Check"
echo "========================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATOS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

CHARTS=$1
if [ -z ${CHARTS} ]; then
  echo "Need list of helm charts to check"
  exit 1
fi

set -e

function inspectImage {
  local IMAGE=$1
  echo ""
  echo -e "${YELLOW}${BOLD}Image: ${IMAGE}${RESET}"
  docker pull ${IMAGE} >& /dev/null
  INFO=$(docker images ${IMAGE})
  echo -e "${CYAN}${INFO}${RESET}"

  # Check OS
  OS=$(docker run -t --entrypoint="/bin/bash" ${IMAGE} -c "cat /etc/os-release | grep PRETTY_NAME")
  echo -e "${CYAN}${OS:12}${RESET}"
}

function processChart {

  local CHART=$1

  rm -rf temp
  mkdir -p temp
  pushd temp &> /dev/null

  echo -e "${CYAN}${BOLD}Chart: ${CHART}${RESET}"
  helm fetch ${CHART}
  CHART_ARCHIVE=$(ls console*.tgz)
  echo "Chart Archive: ${CHART_ARCHIVE}"
  tar -xvf ${CHART_ARCHIVE} >& /dev/null
  echo -e "${YELLOW}Chart.yaml for lastest release:${RESET}"
  cat ./console/Chart.yaml

  IMAGES=$(helm template ./console | grep image:)

  echo -e "${YELLOW}Images referenced in this chart:${RESET}"
  while IFS= read -r IMAGE; do
    IMAGE_REF=$(echo $IMAGE | tr -d '[[:space:]]')
    IMAGE_REF=${IMAGE_REF:6}
    if [ "${IMAGE_REF:0:1}" == ":" ]; then
      IMAGE_REF=${IMAGE_REF:1}
    fi
    if [ "${IMAGE_REF:0:10}" == "docker.io/" ]; then
      IMAGE_REF=${IMAGE_REF:10}
    fi
    inspectImage ${IMAGE_REF}
  done <<< "${IMAGES}"

  popd >& /dev/null
  rm -rf temp
}

Field_Separator=$IFS
IFS=,
for CHART in ${CHARTS};
do
  processChart $CHART
done
IFS=$Field_Separator
