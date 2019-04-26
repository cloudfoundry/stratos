#!/bin/bash

echo "============================================"
echo "Stratos Volume Migration"
echo "============================================"
echo ""
echo "Migrating volume secrets to Kubernetes secrets"
echo ""

function waitForFile() {
  FILE=$1
  local TIMEOUT=0

  while [ ! -f "${FILE}" ]
  do
    sleep 5
    TIMEOUT=$((TIMEOUT+1))
    if [ ${TIMEOUT} -eq 60 ]; then
      echo "Timed out waiting for file ${FILE}"
      exit 1
    fi
    echo "Waiting for file: ${FILE}"
  done
}

CERT_FILE=console.crt
CERT_KEY=console.key
#ENCRYPTION_KEY_FILENAME - Supplied by Helm Chart

# Kubernetes token
KUBE_TOKEN=$(</var/run/secrets/kubernetes.io/serviceaccount/token)
KUBE_API_SERVER=https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_PORT_443_TCP_PORT

# ==============================================================================================================================
# Encryption Key
# ==============================================================================================================================

# Check whether the secret already exists
curl -k \
    --fail \
    -H "Authorization: Bearer $KUBE_TOKEN" \
    -H 'Content-Type: application/json' \
    ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-key-secret > /dev/null

EXISTS=$?
if [ $EXISTS -ne 0 ]; then
  echo "Encryption Key secret does not exist - this should have been created by the Helm Chart"
  exit $EXISTS
fi

# Update the secret with the existing Encryption Key value from the Volume

# Wait for the Encryption Key to appear
echo "Waiting for Encryption Key to be created"
waitForFile "${ENCRYPTION_KEY_VOLUME}/${ENCRYPTION_KEY_FILENAME}"

echo "Encryption key is now available"
KEY=$(cat "${ENCRYPTION_KEY_VOLUME}/${ENCRYPTION_KEY_FILENAME}" | base64 | sed -e 's/[\/&]/\\&/g')

cat << EOF > patch-secret.yaml
{
  "data": {
EOF

echo "\"key\": \"${KEY}\"" >> patch-secret.yaml
echo "} }" >> patch-secret.yaml

echo "Patching secret for the Encryption Key"

# Patch secret for the Encryption Key
curl -k \
    --fail \
    -X PATCH \
    -d @patch-secret.yaml \
    -H "Authorization: Bearer $KUBE_TOKEN" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/merge-patch+json' \
    ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-key-secret > /dev/null

RET_PATCH=$?
echo "Patch Encryption Key secret exit code: $RET_PATCH"
rm -rf patch-secret.yaml
if [ $RET_PATCH -ne 0 ]; then
  echo "Error patching Encryption Key secret"
  exit $RET_PATCH
fi

# ==============================================================================================================================
# Certificate
# ==============================================================================================================================

# Check whether the secret already exists
curl -k \
    --fail \
    -H "Authorization: Bearer $KUBE_TOKEN" \
    -H 'Content-Type: application/json' \
    ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-cert-secret > /dev/null

EXISTS=$?
if [ $EXISTS -ne 0 ]; then
  echo "Certificate secret does not exist - this should have been created by the Helm Chart"
  exit $EXISTS
fi

# Wait for the Certificate to appear
echo "Waiting for Certificate to be created"
waitForFile "${ENCRYPTION_KEY_VOLUME}/${CERT_FILE}"
waitForFile "${ENCRYPTION_KEY_VOLUME}/${CERT_KEY}"
echo "Certificate is now available"
CERT=$(cat "${ENCRYPTION_KEY_VOLUME}/${CERT_FILE}" | base64 | sed -e 's/[\/&]/\\&/g')
KEY=$(cat "${ENCRYPTION_KEY_VOLUME}/${CERT_KEY}" | base64 | sed -e 's/[\/&]/\\&/g')

cat << EOF > patch-secret.yaml
{
  "data": {
EOF

echo "\"tls.crt\": \"${CERT}\"," >> patch-secret.yaml
echo "\"tls.key\": \"${KEY}\"" >> patch-secret.yaml
echo "} }" >> patch-secret.yaml

# Create a secret for the Certificate
curl -k \
    --fail \
    -X PATCH \
    -d @patch-secret.yaml \
    -H "Authorization: Bearer $KUBE_TOKEN" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/merge-patch+json' \
    ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-cert-secret > /dev/null

RET_CREATED=$?
echo "Patch Certificate secret exit code: $?"
rm -rf patch-secret.yaml
if [ $RET_CREATED -ne 0 ]; then
  echo "Error patching Certificate secret $RET_CREATED"
  exit $RET_CREATED
fi

echo ""
echo "Volume Migration completed"
