#!/bin/bash

CHART_PATH=$1

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

echo -e "${CYAN}${BOLD}Applying SUSE customizations to Helm Chart${RESET}"
echo "Customizations folder: ${DIR}"
echo "Chart folder         : ${CHART_PATH}"
echo ""

# ===========================================================================================
# Copy our customization helper over the default, empty one
# ===========================================================================================
cp "${DIR}/__stratos.tpl" "${CHART_PATH}/templates/__stratos.tpl"

# ===========================================================================================
# Chart.yaml changes
# ===========================================================================================

echo -e "${CYAN}Patching Chart.yaml${RESET}"

# Change the sources git repo reference in Chart.yaml
sed -i.bak -e 's@https://github.com/cloudfoundry/stratos@https://github.com/SUSE/stratos@g' ${CHART_PATH}/Chart.yaml

# Change the URL of the icon to be the SUSE one
ICON_URL="https://raw.githubusercontent.com/cloudfoundry/stratos/master/deploy/kubernetes/console/icon.png"
SUSE_ICON_URL="https://raw.githubusercontent.com/SUSE/stratos/master/deploy/kubernetes/custom/icon.png"
sed -i.bak -e 's@'"${ICON_URL}"'@'"${SUSE_ICON_URL}"'@g' ${CHART_PATH}/Chart.yaml

SRC="A Helm chart for deploying Stratos UI Console"
DEST="A Helm chart for deploying SUSE Stratos Console"
sed -i.bak -e 's@'"${SRC}"'@'"${DEST}"'@g' ${CHART_PATH}/Chart.yaml

# ===========================================================================================
# README.md changes
# ===========================================================================================

# Need to apply these carefully

echo -e "${CYAN}Patching README.md${RESET}"

# Change all references to 'Stratos' (case sensitive)
sed -i.bak -e 's@Stratos@SUSE Stratos Console@g' ${CHART_PATH}/README.md

# Change first paragraph to include Kubernetes
SRC="console for Cloud Foundry."
DEST="console for Cloud Foundry and Kubernetes."
sed -i.bak -e 's@'"${SRC}"'@'"${DEST}"'@g' ${CHART_PATH}/README.md

# Change command for helm repo addition
HELM_ADD="helm repo add stratos https://cloudfoundry.github.io/stratos"
SUSE_HELM_ADD="helm repo add suse https://registry.suse.com"
sed -i.bak -e 's@'"${HELM_ADD}"'@'"${SUSE_HELM_ADD}"'@g' ${CHART_PATH}/README.md

# Change command for helm install
HELM_INSTALL="stratos/console"
SUSE_HELM_INSTALL="suse/console  "
sed -i.bak -e 's@'"${HELM_INSTALL}"'@'"${SUSE_HELM_INSTALL}"'@g' ${CHART_PATH}/README.md

SRC="SUSE Stratos Console Helm repository"
DEST="SUSE Helm repository"
sed -i.bak -e 's@'"${SRC}"'@'"${DEST}"'@g' ${CHART_PATH}/README.md

SRC="SUSE Stratos Console UI Console"
DEST="SUSE Stratos Console"
sed -i.bak -e 's@'"${SRC}"'@'"${DEST}"'@g' ${CHART_PATH}/README.md

echo -e "${CYAN}${BOLD}All done applying SUSE customizations to Helm Chart${RESET}"
echo ""