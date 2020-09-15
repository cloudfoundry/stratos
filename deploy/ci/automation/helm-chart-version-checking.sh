#!/bin/bash

echo "========================="
echo "Stratos Helm Version Test"
echo "========================="

# This scrips does dry-run installs using differnt Helm and Kube versions

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATOS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

function log {
  MSG=$1
  echo -e "${CYAN}${BOLD}${MSG}${RESET}"
}

declare -a HELM_VERSIONS=("3.0.0" "2.16.1" "2.15.2" "2.14.3")

set -e

# We should be running in the Stratos GitHub folder

NAME=stratos-test
NAMESPACE=stratos-ns
HELM_REPO=https://cloudfoundry.github.io/stratos
HELM_REPO_NAME=cfstratos

TEMP_FOLDER=${STRATOS}/tmp/helm
mkdir -p ${TEMP_FOLDER}

log "Building Helm chart ..."
pushd "${STRATOS}/deploy/kubernetes" > /dev/null
./build.sh -c -t helmtest
popd > /dev/null

log "Preparing environment ..."

pushd "${TEMP_FOLDER}" > /dev/null

export HELM_HOME=${TEMP_FOLDER}

function getKind {
  if [ ! -f "./kind" ]; then
    curl -Lo ./kind https://github.com/kubernetes-sigs/kind/releases/download/v0.6.1/kind-$(uname)-amd64
    chmod +x ./kind
  fi
}

function getHelm {
  UNAME=`uname | awk '{print tolower($0)}'`
  if [ ! -f "./helm_${1}" ]; then
    log "Getting helm version ${1} [${UNAME}]"
    curl -Lo ./helm_${1}.tar.gz https://get.helm.sh/helm-v${1}-${UNAME}-amd64.tar.gz
    tar -xvzf  ./helm_${1}.tar.gz
    mv ./${UNAME}-amd64/helm ./helm_${1}
    chmod +x ./helm_${1}
    rm -rf ./helm_${1}.tar.gz
    rm -rf ./${UNAME}-amd64
  fi
}

function getKubectl {
  UNAME=`uname | awk '{print tolower($0)}'`
  if [ ! -f "./kubectl_${2}" ]; then
    log "Getting kubectl version ${1}"
    curl -Lo ./kubectl_${2} https://storage.googleapis.com/kubernetes-release/release/v${1}/bin/${UNAME}/amd64/kubectl
    chmod +x ./kubectl_${2}
  fi
}

function cleanup {
  if [ -f "./kind" ]; then
    log "Cleaning up"
    ./kind delete cluster
  fi
}

function wait_for_pods {
  DONE="false"
  NS="$1"

  echo "Waiting for all pods in namespace '$NS' to be ready"
  sleep 5

  PROGRESS="."

  while [ $DONE != "true" ]; do
    PODS=`kubectl get po --namespace=$NS | wc -l`
    RUNNING=`kubectl get po --namespace=$NS | grep 'Running' | wc -l`
    COMPLETED=`kubectl get po --namespace=$NS | grep 'Completed' | wc -l`
    NOTREADY=`kubectl get po --namespace=$NS | grep '0//*' | wc -l`
    PODS=$((PODS-1))
    OKAY=$((RUNNING+COMPLETED))
    NOTREADY=$((NOTREADY-COMPLETED))

    if [ "$PODS" == "$OKAY" ] && [ "$NOTREADY" == "0" ]; then
      echo ""
      echo "All pods are running"
      DONE="true"
    else
      kubectl get po --namespace=$NS
      echo ""
      printf "\r${PODS} pods ($RUNNING are running, $NOTREADY are not yet ready) $PROGRESS               "
      printf "\r${PODS} pods ($RUNNING are running, $NOTREADY are not yet ready) $PROGRESS "
      PROGRESS="$PROGRESS."

      if [ ${#PROGRESS} -eq 10 ]; then
        PROGRESS="."
      fi
    fi

    echo ""

    sleep 5
  done

  echo "Finished waiting for all pods in namespace '$NS'"
}

function do_chart_tests {


  log "Preparing test run"
  ${KUBECTL} cluster-info --context kind-kind
  ${KUBECTL} version
  ${KUBECTL} get nodes

  for i in "${HELM_VERSIONS[@]}"
  do
    if [ "$i" != "$1" ]; then
      log "========================================================================"
      log "Testing Stratos with Helm version $i on Kubernetes ${KUBE}"
      ./helm_$i init
      ./helm_$i version --client

      HELM_MAJOR="${i:0:1}"
      echo ${HELM_MAJOR}

      # V2 and V3 are different
      if [ "${HELM_MAJOR}" == "3" ]; then
        ./helm_$i install stratos "${STRATOS}/deploy/kubernetes/helm-chart" --namespace stratos --dry-run
      else
        ./helm_$i init --upgrade --force-upgrade
        wait_for_pods "kube-system"
        # Don't actually install, just check we can render the chart
        ./helm_$i install "${STRATOS}/deploy/kubernetes/helm-chart" --name stratos --namespace stratos --dry-run
      fi
      log "Done Stratos with Helm version $i on Kubernetes ${KUBE}"
      log "========================================================================"
    else
      log "Skipping testing with Helm version $i due to compatibility issues"
    fi
  done

}

# We always using --dry-run so we don't actually install - we are checking rendering only

# Temp folder

# Just check that there was not a kind cluster from an errored run

cleanup

getKind

# Get Helm client for each version
for i in "${HELM_VERSIONS[@]}"
do
   getHelm "$i"
done

getKubectl 1.16.3 1.16
getKubectl 1.15.6 1.15
getKubectl 1.14.6 1.14

# Kind image references for a few K8S versions that we care about
K8S_16_IMAGE=kindest/node:v1.16.3
K8S_15_IMAGE=kindest/node:v1.15.6
K8S_14_IMAGE=kindest/node:v1.14.6

# At this point we have the kind and helm tools

# Set up a kind kube 1.14 cluster

log "Kubernetes 1.14 Cluster ..."
KUBE=1.14
./kind create cluster --image ${K8S_14_IMAGE}
KUBECTL=./kubectl_1.14
do_chart_tests
./kind delete cluster

log "Kubernetes 1.15 Cluster ..."
KUBE=1.15
./kind create cluster --image ${K8S_15_IMAGE}
KUBECTL=./kubectl_1.15
do_chart_tests
./kind delete cluster

log "Kubernetes 1.16 Cluster ..."
KUBE=1.16
./kind create cluster --image ${K8S_16_IMAGE}
KUBECTL=./kubectl_1.16

# Helm 2.14.3 won't work with Kubernetes 1.16
do_chart_tests "2.14.3"
./kind delete cluster

log "All checks completed"

popd > /dev/null
