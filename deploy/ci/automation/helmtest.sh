#!/bin/bash

echo "================="
echo "Stratos Helm Test"
echo "================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATOS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

set -e

# We should be running in the Stratos GitHub folder

NAME=stratos-test
NAMESPACE=stratos-ns
HELM_REPO=https://cloudfoundry-incubator.github.io/stratos
HELM_REPO_NAME=cfstratos

DEV_IMAGE_VERSION=2.0.0-dev

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
  while [ $DONE != "true" ]; do
    COUNT=$(kubectl get po --namespace=${NAMESPACE} | wc -l)
    kubectl get po --namespace=${NAMESPACE}
    if [ $COUNT -eq 3 ]; then
      READY=$(kubectl get po --namespace=${NAMESPACE} | grep "Running" | wc -l)
      if [ $READY -eq 2 ]; then
        READY1=$(kubectl get po --namespace=${NAMESPACE} | grep "3/3" | wc -l)
        READY2=$(kubectl get po --namespace=${NAMESPACE} | grep "1/1" | wc -l)
        READY=$(($READY1 + $READY2))
        if [ $READY -eq 2 ]; then
          DONE="true"
        fi
      fi
    fi
    if [ "$DONE" != "true" ]; then
      echo "Waiting for Stratos Helm release to be ready..."
      sleep 5
    fi
  done
}

function checkVersion {
  VERS=$1
  STATUS=$(helm list ${NAME} | grep ${NAME})
  STATUS=$(echo $STATUS | awk '{$1=$1};1')
  local HELM_STATUS_REGEX='^([a-z\-]*) ([0-9]*) ([A-Z][a-z][a-z] [A-Z][a-z][a-z] [0-9]* [0-9][0-9]:[0-9][0-9]:[0-9][0-9] [0-9][0-9][0-9][0-9]) ([A-Z]*) ([0-9\.a-z\-]*) ([0-9\.]*) ([a-z\-]*)'
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
}

function log {
  MSG=$1
  echo -e "${CYAN}${BOLD}${MSG}${RESET}"
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
TMP_DIR=${TMP_DIR:-/tmp}
HELM_TMP=${TMP_DIR}/stratos_helm_test
echo $HELM_TMP

rm -rf ${HELM_TMP}
mkdir -p ${HELM_TMP}
cp -R "${STRATOS}/deploy/kubernetes/console" ${HELM_TMP}

pushd ${HELM_TMP} > /dev/null
# Make sure we can package the chart
helm package ${HELM_TMP}/console

CHART_FILE=$(ls ${HELM_TMP}/*.tgz)
CHART_FILE=$(printf %q "${CHART_FILE}")
echo "Chart file path: ${CHART_FILE}"

popd > /dev/null

log "Upgrading using latest Helm Chart"
helm upgrade ${NAME} ${CHART_FILE} --recreate-pods --debug --set consoleVersion=${DEV_IMAGE_VERSION} --set imagePullPolicy=Always

checkVersion console-0.1.0
waitForHelmRelease

# Change just the chart version and try to upgrade
sed -i.bak -e 's/version: 0.1.0/version: 0.2.0/g' ${HELM_TMP}/console/Chart.yaml
sed -i.bak -e 's/appVersion: 0.1.0/appVersion: 0.2.0/g' ${HELM_TMP}/console/Chart.yaml
cat ${HELM_TMP}/console/Chart.yaml

log "Upgrading using latest Helm Chart (checking chart upgrade)"
helm upgrade ${NAME} ${HELM_TMP}/console --recreate-pods --debug --set consoleVersion=${DEV_IMAGE_VERSION} --set imagePullPolicy=Always

waitForHelmRelease
checkVersion console-0.2.0

# Upgrade test passed - try simple install of latest chart
deleteRelease

log "Installing using latest Helm Chart"
helm install ${CHART_FILE} --name ${NAME} --namespace ${NAMESPACE} --set consoleVersion=${DEV_IMAGE_VERSION} --set imagePullPolicy=Always

waitForHelmRelease
checkVersion console-0.1.0

deleteRelease

# Upgrade test using --reuse-values

# Install latest version first
log "Testing Upgrade using --reuse-values"
log "Installing latest release"
helm install ${HELM_REPO_NAME}/console --name ${NAME} --namespace ${NAMESPACE}

# Wait for the chart to deploy and be ready
waitForHelmRelease

log "Upgrading using --reuse-values"
helm upgrade ${NAME} ${HELM_TMP}/console --recreate-pods --debug --reuse-values

waitForHelmRelease
# Should have used same values as before
checkVersion console-0.2.0

# All okay
deleteRelease

log "All checks completed"
