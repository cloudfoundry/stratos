#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATOS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

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

function deleteRelease {
  helm delete ${NAME} --purge
  kubectl delete namespace ${NAMESPACE}

  local DONE="false"
  while [ $DONE != "true" ]; do
    COUNT=$(kubectl get namespaces | grep ${NAMESPACE} | wc -l)
    if [ $COUNT -eq 0 ]; then
      DONE="true"
    else      
      echo "Waiting for namespace to terminate..."
      sleep 10
    fi
  done
}

function waitForHelmRelease {
  echo "Waiting for Stratos Helm Release to be ready..."
  local DONE="false"
  local TIMEOUT=0
  while [ $DONE != "true" ]; do
    COUNT=$(kubectl get po --namespace=${NAMESPACE} | wc -l)
    kubectl get po --namespace=${NAMESPACE}
    if [ $COUNT -ge 3 ]; then
      # COUNT includes the column header line
      READY=$(kubectl get po --namespace=${NAMESPACE} | grep "Running" | wc -l)
      COMPLETED=$(kubectl get po --namespace=${NAMESPACE} | grep "Completed" | wc -l)
      TOTAL=$(($READY + $COMPLETED))
      EXPECTED=$(($COUNT - 1))
      if [ $TOTAL -eq $EXPECTED ]; then
        READY3=$(kubectl get po --namespace=${NAMESPACE} | grep "3/3" | wc -l)
        READY2=$(kubectl get po --namespace=${NAMESPACE} | grep "2/2" | wc -l)
        READY1=$(kubectl get po --namespace=${NAMESPACE} | grep "1/1" | wc -l)
        READY=$(($READY1 + $READY2 + $READY3))
        if [ $READY -eq 2 ]; then
          DONE="true"
        fi
      fi
    fi
    if [ "$DONE" != "true" ]; then
      echo "Waiting for Stratos Helm release to be ready..."
      sleep 10
      TIMEOUT=$((TIMEOUT+1))
      if [ ${TIMEOUT} -gt 60 ]; then
        echo "Timed out waiting for Helm release to be ready"
        exit 1
      fi
    fi
  done
}

function checkVersion {
  VERS=$1
  STATUS=$(helm list ${NAME} | grep ${NAME})
  STATUS=$(echo $STATUS | awk '{$1=$1};1')
  local HELM_STATUS_REGEX='^([a-z\-]*) ([0-9]*) ([A-Z][a-z][a-z] [A-Z][a-z][a-z] [0-9]* [0-9][0-9]:[0-9][0-9]:[0-9][0-9] [0-9][0-9][0-9][0-9]) ([A-Z]*) ([0-9\.a-z\-]*) ([0-9\.a-z\-]*) ([a-z\-]*)'
  echo -e $STATUS
  if [[ "${STATUS}" =~ ${HELM_STATUS_REGEX} ]]; then
    # 6 is version
    if [ "${BASH_REMATCH[5]}" != "${VERS}" ]; then
      echo "Deployed version number incorrect"
      exit 1
    fi
  else
    echo "Helm status parsing failed"
    exit 1
  fi

  echo "Helm release version ok (${BASH_REMATCH[5]})"
}

function log {
  MSG=$1
  echo -e "${CYAN}${BOLD}"
  echo "========================================================================================================="
  echo "==>> ${MSG}"
  echo "========================================================================================================="
  echo -e "${RESET}"
}

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