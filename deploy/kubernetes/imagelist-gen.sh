#!/bin/bash

# Colours
CYAN="\033[96m"
YELLOW="\033[93m"
RED="\033[91m"
RESET="\033[0m"
BOLD="\033[1m"

__DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

printf "${BOLD}${CYAN}Generating ${YELLOW}imagelist.txt${RESET}\n"
echo ""

STRATOS_FOLDER="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd ../../ && pwd )"

# Add any customizations
function addCustomizations() {

  if [ -f "${STRATOS_FOLDER}/deploy/kubernetes/custom/imagelist.txt" ];then
    echo "Including custom imagelist contents"
    cat "${STRATOS_FOLDER}/deploy/kubernetes/custom/imagelist.txt" >> ./imagelist.txt

    # Update version number
    VERSION=$(grep -Po 'consoleVersion: \K(.*)' ./values.yaml)
    echo "Image Version: ${VERSION}"
    sed -i 's/_VERSION_/'"${VERSION}"'/g' imagelist.txt
  fi
}


CHART_FOLDER=${1}

if [ -z "${CHART_FOLDER}" ]; then
  echo -e "${BOLD}${RED}ERROR: You must supply chart folder${RESET}"
  exit 1
fi

if [ ! -d "${CHART_FOLDER}" ]; then
  echo -e "${BOLD}${RED}ERROR: Chart folder '${CHART_FOLDER}' does not exist${RESET}"
  exit 1
fi

if [ ! -f "${CHART_FOLDER}/Chart.yaml" ]; then
  echo -e "${BOLD}${RED}ERROR: No Chart.yaml found in chart folder '${CHART_FOLDER}'${RESET}"
  exit 1
fi

printf "${BOLD}${CYAN}Generating image list in ${CHART_FOLDER}${RESET}\n"
pushd ${CHART_FOLDER} > /dev/null
printf "${CYAN}Chart folder contents:${RESET}\n"
ls -alR
echo ""

helm template -f ${__DIRNAME}/imagelist.values.yaml ${CHART_FOLDER} | grep "image:" | grep --extended --only-matching '([^"/[:space:]]+/)?[^"/[:space:]]+/[^:[:space:]]+:[a-zA-Z0-9\._-]+' | sort | uniq | awk -F'/' '{print $2}' > imagelist.txt
if [ $? -ne 0 ]; then
  echo -e "${BOLD}${RED}ERROR: Failed to render Helm Chart in order to generate image list"
  exit 1
fi

# Add any customizations to the image list
# Mainly used if there are unreferenced images that need to be included
addCustomizations

popd > /dev/null

printf "${CYAN}"
echo "Image List:"
echo ""
cat ${CHART_FOLDER}/imagelist.txt
printf "${RESET}"
echo ""
