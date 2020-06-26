#!/usr/bin/env bash

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

echo "Creating Service Account"
SRC="${STRATOS_DIR}/deploy/kubernetes/console/templates/service-account.yaml"

TEMPFILE=$(mktemp)
cp $SRC $TEMPFILE
sed -i.bak '/\s*helm/d' $TEMPFILE
sed -i.bak '/\s*app\.kubernetes\.io\/version/d' $TEMPFILE
sed -i.bak '/\s*app\.kubernetes\.io\/instance/d' $TEMPFILE
sed -i.bak '/\s*{{-/d' $TEMPFILE

# Create a namespace
NS="stratos-dev"
kubectl get ns $NS > /dev/null 2>&1
if [ $? -ne 0 ]; then
  kubectl create ns $NS
fi

kubectl apply -n $NS -f $TEMPFILE
USER=stratos-dev-admin-user
USER=stratos

# Service account should be created - now need to get token
SECRET=$(kubectl get -n $NS sa $USER -o json | jq -r '.secrets[0].name')
TOKEN=$(kubectl get -n $NS secret $SECRET -o json | jq -r '.data.token')
echo "Token secret: $SECRET"
TOKEN=$(echo $TOKEN | base64 -d -)
echo "Token         $TOKEN"

rm -f $TEMPFILE
rm -f $TEMPFILE.bak

CFG=${STRATOS_DIR}/src/jetstream/config.properties
touch $CFG

echo -e "\n# Kubernetes Terminal Config for dev" >> $CFG
echo "STRATOS_KUBERNETES_NAMESPACE=stratos-dev" >> $CFG
echo "STRATOS_KUBERNETES_TERMINAL_IMAGE=splatform/stratos-kube-terminal:dev" >> $CFG
echo "KUBE_TERMINAL_SERVICE_ACCOUNT_TOKEN=$TOKEN" >> $CFG

MKUBE=$(minikube ip)
if [ $? -eq 0 ]; then
  echo "KUBERNETES_SERVICE_HOST=$MKUBE" >> $CFG
  echo "KUBERNETES_SERVICE_PORT=8443" >> $CFG
else
  echo "KUBERNETES_SERVICE_HOST=" >> $CFG
  echo "KUBERNETES_SERVICE_PORT=8443" >> $CFG
fi
