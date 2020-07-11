#!/bin/bash

echo "============================================"
echo "Stratos Configuration Init Job"
echo "============================================"
echo ""
echo "Generating Secrets"
echo ""
echo "NAMESPACE                   : ${NAMESPACE}"
echo "RELEASE_NAME                : ${RELEASE_NAME}"
echo "RELEASE_REVISION            : ${RELEASE_REVISION}"
echo "IS_UPGRADE                  : ${IS_UPGRADE}"
echo "CONSOLE_TLS_SECRET_NAME     : ${CONSOLE_TLS_SECRET_NAME}"
echo ""
echo "============================================"
echo ""

# Kubernetes token
KUBE_TOKEN=$(</var/run/secrets/kubernetes.io/serviceaccount/token)
KUBE_API_SERVER=https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_PORT_443_TCP_PORT

function deleteSecret {
  SECRET_NAME=$1

  # Delete the old secret
  curl -k -s \
       --fail \
      -X DELETE \
      -d @- \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H 'Accept: application/json' \
      -H 'Content-Type: application/json' \
      ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-${SECRET_NAME} > /dev/null 2>&1 <<'EOF' 
  {}
EOF
  DELETED=$?
  if [ $DELETED -ne 0 ]; then
    echo "Unable to delete secret: ${RELEASE_NAME}-${SECRET_NAME} - error code: ${DELETED}"
  fi
}

function generateCert {
  echo "Using cert generator to generate a self-signed certificate ..."
  export CERTS_PATH=./certs
  export DEV_CERTS_DOMAIN=tls
  mkdir -p ${CERTS_PATH}
  /generate_cert.sh
  CERT_CRT=$(cat ${CERTS_PATH}/tls.crt | base64 -w 0)
  CERT_KEY=$(cat ${CERTS_PATH}/tls.key | base64 -w 0)
  rm -rf ${CERTS_PATH}
}

###
# --delete flag is used in the cleanup hook to remove the secret
###
if [ "$1" == "--delete" ]; then
  echo "Cleanup up - delete hook"
  # Delete the old secrets
  deleteSecret "key"
  deleteSecret "cert"
  exit 0
fi

###############################################################################################################################
# Encryption key
###############################################################################################################################

KEY=""

# Just look for the secret - if its not there, we need to create it - otherwise leave it alone

# Check whether the secret already exists
echo "Checking encryption key secret does not already exist ..."
curl -k -s \
    --fail \
    -H "Authorization: Bearer $KUBE_TOKEN" \
    -H 'Content-Type: application/json' \
    ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-key > ./key.json 2>&1

EXISTS=$?
rm -f key.json
if [ $EXISTS -eq 0 ]; then
  echo "Encryption Key secret already exists - nothing to do"
else
  echo "Fresh installation - generating a new Encryption Key secret"

  # Generate a random encryption key
  echo "Generating a new Encryption Key ..."
  KEY=$(openssl enc -aes-256-cbc -k secret -P -md sha1 | grep key | cut -d '=' -f2 | base64 -w 0)

  # We will create a new secret for the encryption key
  cat << EOF > create-key-secret.yaml
  {
    "kind": "Secret",
    "apiVersion": "v1",
    "type": "Opaque",
    "metadata": {
      "name": "@@NAME@@",
      "labels": {
        "stratos-helm-resource": "@@NAME@@",
        "app.kubernetes.io/name": "stratos",
        "app.kubernetes.io/instance": "@@RELEASE_NAME@@"
      }
    },
    "data": {
      "key": "@@KEY@@"
    }
  }
EOF

  NAME="${RELEASE_NAME}-key"
  sed -i.bak "s/@@NAME@@/${NAME}/g" create-key-secret.yaml
  sed -i.bak "s/@@KEY@@/${KEY}/g" create-key-secret.yaml
  sed -i.bak "s/@@RELEASE_NAME@@/${RELEASE_NAME}/g" create-key-secret.yaml

  echo "Creating secret for the Encryption Key: ${NAME}"

  # Create secret for the Encryption Key
  curl -k -s \
      --fail \
      -X POST \
      -d @create-key-secret.yaml \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H 'Accept: application/json' \
      -H 'Content-Type: application/json' \
      ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets > /dev/null 2>&1

  RET_CREATE=$?
  echo "Create Encryption Key secret exit code: $RET_CREATE"
  rm -rf create-key-secret.yaml
  if [ $RET_CREATE -ne 0 ]; then
    echo "Error creating Encryption Key secret"
    exit $RET_CREATE
  fi

  echo "Encryption key init complete"

fi

echo ""
echo "============================================"

###############################################################################################################################
# TLS Certificate
###############################################################################################################################

echo "Checking TLS Certificate ..."

# Start with these empty to indicate we won't create a secret for the TLS certificate
CERT_CRT=""
CERT_KEY=""

# If CONSOLE_TLS_SECRET_NAME is set, then we don't need to create a certificate
if [ -n "${CONSOLE_TLS_SECRET_NAME}" ]; then
  echo "Console is using secret ${CONSOLE_TLS_SECRET_NAME} to provide TLS certificate - nothing to do"
else
  curl -k -s \
      --fail \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H 'Content-Type: application/json' \
      ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-cert > ./cert.json 2>&1

  EXISTS=$?
  if [ $EXISTS -eq 0 ]; then
    echo "Certificate secret already exists - nothing to do"
  else

    # Need a new certificate
    echo "New certificate needed ..."
    generateCert

    # We will create a new secret for the certificate
    cat << EOF > create-cert-secret.yaml
    {
      "kind": "Secret",
      "apiVersion": "v1",
      "type": "kubernetes.io/tls",
      "metadata": {
        "name": "@@NAME@@",
        "labels": {
          "stratos-helm-resource": "@@NAME@@",
          "app.kubernetes.io/name": "stratos",
          "app.kubernetes.io/instance": "@@RELEASE_NAME@@"
        }
      },
      "data": {
        "tls.crt": "@@CRT@@",
        "tls.key": "@@KEY@@"
      }
    }
EOF

    NAME="${RELEASE_NAME}-cert"

    sed -i.bak "s/@@NAME@@/${NAME}/g" create-cert-secret.yaml
    sed -i.bak "s/@@RELEASE_NAME@@/${RELEASE_NAME}/g" create-cert-secret.yaml
    sed -i.bak "s/@@CRT@@/${CERT_CRT}/g" create-cert-secret.yaml
    sed -i.bak "s/@@KEY@@/${CERT_KEY}/g" create-cert-secret.yaml

    # Create secret for the Certificate
    echo "Creating secret for the Certificate: ${NAME}"
    curl -k -s \
        --fail \
        -X POST \
        -d @create-cert-secret.yaml \
        -H "Authorization: Bearer $KUBE_TOKEN" \
        -H 'Accept: application/json' \
        -H 'Content-Type: application/json' \
        ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets > /dev/null 2>&1

    RET_CREATE=$?
    echo ""
    echo "Create Certificate secret exit code: $RET_CREATE"
    rm -rf create-cert-secret.yaml
    if [ $RET_CREATE -ne 0 ]; then
      echo "Error creating Certificate secret"
      exit $RET_CREATE
    fi  
  fi
fi

echo ""
echo "============================================"
echo "Stratos init job complete"
echo "============================================"
