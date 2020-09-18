#!/bin/bash

# Build and deploy Stratos using Helm to Minikube
# Run Stratos E2E tests to validate correct operation

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATOS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"
source "${DIRPATH}/helm-utils.sh"

echo -e "${YELLOW}${BOLD}"
echo "========================================================================================================="
echo "===== Stratos Helm E2E Tests                                                                        ====="
echo "========================================================================================================="
echo -e "${RESET}"

set -e

BUILD="true"
DEPLOY="true"

while getopts "dba:" opt; do
  case $opt in
    a)
      HELM_ARGS="${OPTARG}"
      ;;
    b)
      BUILD="false"
      ;;
    d)
      DEPLOY="false"
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

# This will fail is Tiller is not installed
helm version

# We should be running in the Stratos GitHub folder

NAME=stratos-test
NAMESPACE=stratos-ns
HELM_REPO=https://cloudfoundry.github.io/stratos
NODE_PORT=32123
log "Performing checks ..."

# Check secrets file

echo "TEST_CONFIG_URL: ${TEST_CONFIG_URL}"

if [ -z "${TEST_CONFIG_URL}" ]; then
  TEST_CONFIG_URL="${STRATOS}/secrets.yaml"
  echo "Updated TEST_CONFIG_URL: ${TEST_CONFIG_URL}"
fi

if [ ! -f "${TEST_CONFIG_URL}" ]; then
  echo "No secrets.yaml file"
  exit 1
fi

# Is the test config file a local file? (must be absolute path)
if [[ "${TEST_CONFIG_URL}" == /* ]]; then
  rm -f secrets.yaml
  cp "${TEST_CONFIG_URL}" secrets.yaml
else
  # Get the E2E config
  rm -f secrets.yaml
  curl -k ${TEST_CONFIG_URL} --output secrets.yaml
fi

SECRETS_FILE="${STRATOS}/secrets.yaml"

# Use correct sed command for Mac
SED="sed -r"
unamestr=`uname`
if [[ "$unamestr" == 'Darwin' ]]; then
   SED="sed -E"
fi   

# Parse out the UAA endpoint from the secrets file
UAA=$(cat "${SECRETS_FILE}" | grep tokenEndpoint)
UAA="$(echo -e "${UAA}" | $SED -e 's@^[[:space:]]*@@' -e 's@[[:space:]]*$@@')"
UAA=${UAA/tokenEndpoint: /}
REGEX="^https://([a-z\.\-]*):([0-9]*)"
if [[ $UAA =~ $REGEX ]]; then
  HELM_ARGS="--set env.UAA_HOST=${BASH_REMATCH[1]}"
  if [ -n "${BASH_REMATCH[2]}" ]; then
    HELM_ARGS="${HELM_ARGS} --set env.UAA_PORT=${BASH_REMATCH[2]}"
  fi
fi

echo "Using UAA: ${UAA}"

# Check that a helm release from a previous run is not still deployed
EXISTING=$(helm list | grep ${NAME} | wc -l)
if [ "$EXISTING" -ne 0 ]; then
  if [ "${DEPLOY}" == "true" ]; then
    echo "Stratos is already deployed - deleting"
    deleteRelease
  fi
fi

# Now build the Helm Chart and images locally - use Minikube's docker daemon, so we don't have to push and pull images
if [ "${BUILD}" == "true" ]; then
  # If minikube is running with driver=nonde, we don't need to do this
  DRIVER_NONE=$(cat ~/.minikube/machines/minikube/config.json | grep '"DriverName": "none"' -c)
  if [ ${DRIVER_NONE} -eq 0 ]; then
    eval $(minikube docker-env)
  else
    echo "Minikube is dpeloyed with driver=none"
  fi
  log "Building images and Helm Chart ..."
  set -x
  "${STRATOS}/deploy/kubernetes/build.sh" -s
fi

#HELM_ARGS can be used to supply additional args

echo "$HELM_ARGS"

 
if [ "${DEPLOY}" == "true" ]; then
  log "Deployinh Stratos using Helm ..."
  # Install Stratos using Helm
  helm install "${STRATOS}/deploy/kubernetes/helm-chart" \
    --name ${NAME} \
    --namespace ${NAMESPACE} \
    --set imagePullPolicy=Never \
    --set console.service.type=NodePort \
    --set console.service.nodePort=${NODE_PORT} ${HELM_ARGS}

  waitForHelmRelease
fi

# Run E2E tests

echo -e "${BOLD}${GREEN}"
echo "==============================================================================="
echo ""
echo "Running E2E Tests...."
echo -e "${RESET}"

SUITE=""

# Prepare and run E2E tests
#rm -rf node_modules
npm install

# Clean the E2E reports folder
rm -rf ./e2e-reports
mkdir -p ./e2e-reports
export E2E_REPORT_FOLDER=./e2e-reports

# Assume we are running on minikube ip CONSOLE_IP is not set
if [ -z "${CONSOLE_IP}" ]; then
  CONSOLE_IP=$(minikube ip)
fi

STRATOS_URL=https://${CONSOLE_IP}:${NODE_PORT}
echo "Stratos URL is ${STRATOS_URL}"

set +e

# Run the E2E tests
"$DIRPATH/runandrecord.sh" ${STRATOS_URL} ${SUITE}
RET=$?

if [ "${DEPLOY}" == "true" ]; then
  log "Deleting release ..."
  #deleteRelease
fi

log "Done"

exit $RET