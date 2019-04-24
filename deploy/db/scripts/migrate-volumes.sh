#!/bin/bash
# set -e

echo "Stratos Volume Migration"

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
    ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-encryption-key > /dev/null

EXISTS=$?
if [ $EXISTS -eq 0 ]; then
  echo "Encryption Key secret already exists .. will not create again"
else
  # Wait for the Encryption Key to appear
  echo "Waiting for Encryption Key to be created"
  waitForFile "${ENCRYPTION_KEY_VOLUME}/${ENCRYPTION_KEY_FILENAME}"
  echo "Encryption key is now available"
  KEY=$(cat "${ENCRYPTION_KEY_VOLUME}/${ENCRYPTION_KEY_FILENAME}")
  cat << EOF > create-secret.yaml
  {
    "kind": "Secret",
    "apiVersion": "v1",
    "metadata": {
      "name": "@RELEASE_NAME-encryption-key",
      "labels": {
        "app.kubernetes.io/component": "console-encryption-key",
        "app.kubernetes.io/instance": "@RELEASE_NAME",
        "app.kubernetes.io/name": "stratos"
      }
    },
    "data": {
      "key": "@KEY"
    }
  }
EOF

  sed -i -e 's/@RELEASE_NAME/'"${RELEASE_NAME}"'/g' create-secret.yaml
  sed -i -e 's/@KEY/'"${KEY}"'/g' create-secret.yaml

  echo "Creating secret for the Encryption Key"

  # Create a secret for the Encryption Key
  curl -k \
      --fail \
      -X POST \
      -d @create-secret.yaml \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H 'Accept: application/json' \
      -H 'Content-Type: application/json' \
      ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets > /dev/null

  RET_CREATED=$?
  echo "Create secret exit code: $RET_CREATED"
  rm -rf create-secret.yaml
  if [ $RET_CREATED -ne 0 ]; then
    echo "Error creating Encryption Key secret $RET_CREATED"
    exit $RET_CREATED
  fi
fi

# ==============================================================================================================================
# Certificate
# ==============================================================================================================================

# Check whether the secret already exists
curl -k \
    --fail \
    -H "Authorization: Bearer $KUBE_TOKEN" \
    -H 'Content-Type: application/json' \
    ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-certificate > /dev/null

EXISTS=$?
if [ $EXISTS -eq 0 ]; then
  echo "Certificate secret already exists .. will not create again"
else
  # Wait for the Certificate to appear
  echo "Waiting for Certificate to be created"
  waitForFile "${ENCRYPTION_KEY_VOLUME}/${CERT_FILE}"
  waitForFile "${ENCRYPTION_KEY_VOLUME}/${CERT_FILE}"
  echo "Certificate is now available"
  CERT=$(cat "${ENCRYPTION_KEY_VOLUME}/${CERT_FILE}" | base64 | sed -e 's/[\/&]/\\&/g')
  KEY=$(cat "${ENCRYPTION_KEY_VOLUME}/${CERT_KEY}" | base64 | sed -e 's/[\/&]/\\&/g')

  cat << EOF > create-secret.yaml
  {
    "kind": "Secret",
    "apiVersion": "v1",
    "metadata": {
      "name": "@RELEASE_NAME-certificate",
      "labels": {
        "app.kubernetes.io/component": "console-certificate",
        "app.kubernetes.io/instance": "@RELEASE_NAME",
        "app.kubernetes.io/name": "stratos"
      }
    },
    "data": {
EOF

  sed -i -e 's/@RELEASE_NAME/'"${RELEASE_NAME}"'/g' create-secret.yaml

  echo "\"console.crt\": \"${CERT}\"," >> create-secret.yaml
  echo "\"console.key\": \"${KEY}\"" >> create-secret.yaml
  echo "} }" >> create-secret.yaml

  # Create a secret for the Certificate
  curl -k \
      --fail \
      -X POST \
      -d @create-secret.yaml \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H 'Accept: application/json' \
      -H 'Content-Type: application/json' \
      ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets > /dev/null

  RET_CREATED=$?
  echo "Create secret exit code: $?"
  rm -rf create-secret.yaml
  if [ $RET_CREATED -ne 0 ]; then
    echo "Error creating Certificate secret $RET_CREATED"
    exit $RET_CREATED
  fi
fi

echo "Volume Migration completed"
