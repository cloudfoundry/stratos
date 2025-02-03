#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATOS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"
source "${DIRPATH}/helm-utils.sh"

echo -e "${YELLOW}${BOLD}"
echo "========================================================================================================="
echo "===== Stratos Helm Tests                                                                            ====="
echo "========================================================================================================="
echo -e "${RESET}"

set -e

# We should be running in the Stratos GitHub folder

NAME=stratos-test
NAMESPACE=stratos-ns
HELM_REPO=https://cloudfoundry.github.io/stratos
HELM_REPO_NAME=cfstratos

# Image tag to use - this script only builds the chart
# Normally we use the nightly images for testing here
DEV_IMAGE_VERSION=${STRATOS_IMAGE_TAG:-3.0.0-nightly}

log "Performing checks..."

# Check that a helm release from a previous run is not still deployed
EXISTING=$(helm list | grep ${NAME} | wc -l)
if [ "$EXISTING" -ne 0 ]; then
  echo "Stratos is already deployed - deleting"
  deleteRelease
fi

# Check that we have the Stratos Open Source Helm Repository
EXISTING=$(helm repo list | grep ${HELM_REPO_NAME} | wc -l)
if [ "$EXISTING" -ne 1 ]; then
  echo "Stratos Helm Repository not added - adding"
  helm repo add ${HELM_REPO_NAME} ${HELM_REPO}
fi

KUBE_FOLDER="${STRATOS}/deploy/kubernetes"
HELM_TMP="${STRATOS}/deploy/kubernetes/helm-chart"
echo $HELM_TMP
echo  "${KUBE_FOLDER}"
pushd "${KUBE_FOLDER}" > /dev/null
rm -rf *.tgz
popd > /dev/null

# Update repos
helm repo update

# List Helm chart latest version
helm search ${HELM_REPO_NAME}/console

# Install latest version first
log "Installing latest release"
helm install ${HELM_REPO_NAME}/console --name ${NAME} --namespace ${NAMESPACE}

# Wait for the chart to deploy and be ready
waitForHelmRelease

# Try and upgrade to the latest Chart

# Copy the helm chart folder to a temp location

# Use the buil script to build the Helm Chart
KUBE_FOLDER="${STRATOS}/deploy/kubernetes"
HELM_TMP="${STRATOS}/deploy/kubernetes/helm-chart"
echo $HELM_TMP

echo  "${KUBE_FOLDER}"
ls -al "${KUBE_FOLDER}"
rm -rf "${KUBE_FOLDER}/*.tgz"

# Build the chart with the specific version for images
"${STRATOS}/deploy/kubernetes/build.sh" -z -c -n -t ${DEV_IMAGE_VERSION}

CHART_FILE="${KUBE_FOLDER}/console-${DEV_IMAGE_VERSION}.tgz"
echo "Chart file path: ${CHART_FILE}"

log "Upgrading using latest Helm Chart"
helm upgrade ${NAME} "${CHART_FILE}" --debug --set consoleVersion=${DEV_IMAGE_VERSION} --set imagePullPolicy=Always

checkVersion console-${DEV_IMAGE_VERSION}
waitForHelmRelease

ls -al "${HELM_TMP}"

# Change just the chart version and try to upgrade
sed -i.bak -e 's/version: '"${DEV_IMAGE_VERSION}"'/version: 0.2.0/g' "${HELM_TMP}/Chart.yaml"
sed -i.bak -e 's/appVersion: '"${DEV_IMAGE_VERSION}"'/appVersion: 0.2.0/g' "${HELM_TMP}/Chart.yaml"
cat "${HELM_TMP}/Chart.yaml"

log "Upgrading using latest Helm Chart (checking chart upgrade)"
helm upgrade ${NAME} "${HELM_TMP}" --debug --set imagePullPolicy=Always

waitForHelmRelease
checkVersion console-0.2.0

# Upgrade test passed - try simple install of latest chart
deleteRelease

log "Installing using latest Helm Chart"
helm install "${CHART_FILE}" --name ${NAME} --namespace ${NAMESPACE} --set imagePullPolicy=Always

waitForHelmRelease
checkVersion console-${DEV_IMAGE_VERSION}

deleteRelease

# Upgrade test using --reuse-values

# Install latest version first
log "Testing Upgrade using --reuse-values"
log "Installing latest release"
helm install ${HELM_REPO_NAME}/console --name ${NAME} --namespace ${NAMESPACE}

# Wait for the chart to deploy and be ready
waitForHelmRelease

log "Upgrading using --reuse-values"
helm upgrade ${NAME} "${HELM_TMP}" --debug --reuse-values

waitForHelmRelease
# Should have used same values as before
checkVersion console-0.2.0

# All okay
deleteRelease

log "All checks completed"