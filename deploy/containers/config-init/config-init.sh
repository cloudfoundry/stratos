#!/bin/bash

echo "============================================"
echo "Stratos Configuration Init Job"
echo "============================================"
echo ""
echo "Generating/Rotating Secrets"
echo ""
echo "NAMESPACE                   : ${NAMESPACE}"
echo "RELEASE_NAME                : ${RELEASE_NAME}"
echo "RELEASE_REVISION            : ${RELEASE_REVISION}"
echo "IS_UPGRADE                  : ${IS_UPGRADE}"
echo "CONSOLE_TLS_SECRET_NAME     : ${CONSOLE_TLS_SECRET_NAME}"
echo "ENCRYPTION_KEY_VOLUME       : ${ENCRYPTION_KEY_VOLUME}"
echo "ENCRYPTION_KEY_FILENAME     : ${ENCRYPTION_KEY_FILENAME}"
echo "CONSOLE_PROXY_CERT_PATH     : ${CONSOLE_PROXY_CERT_PATH}"
echo "CONSOLE_PROXY_CERT_KEY_PATH : ${CONSOLE_PROXY_CERT_KEY_PATH}"
echo ""

# Kubernetes token
KUBE_TOKEN=$(</var/run/secrets/kubernetes.io/serviceaccount/token)
KUBE_API_SERVER=https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_PORT_443_TCP_PORT

function deleteSecret {
  PREFIX=$1
  REVISION=$2

  # Delete the old secret
  curl -k -s \
       --fail \
      -X DELETE \
      -d @- \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H 'Accept: application/json' \
      -H 'Content-Type: application/json' \
      ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-${PREFIX}-${REVISION} > /dev/null 2>&1 <<'EOF' 
  {}
EOF
  DELETED=$?
  if [ $DELETED -ne 0 ]; then
    echo "Unable to delete secret: ${RELEASE_NAME}-${PREFIX}-${REVISION} - error code: ${DELETED}"
  fi
}

function generateCert {
  if [ -n "${CONSOLE_PROXY_CERT_PATH}" ] && [ -n "${CONSOLE_PROXY_CERT_KEY_PATH}" ]; then
    if [ -f "${CONSOLE_PROXY_CERT_PATH}" ] && [ -f "${CONSOLE_PROXY_CERT_KEY_PATH}" ]; then
      echo "Found existing certificate on encryption key volume - going to use it"
      CERT_CRT=$(cat ${CONSOLE_PROXY_CERT_PATH} | base64 -w 0)
      CERT_KEY=$(cat ${CONSOLE_PROXY_CERT_KEY_PATH} | base64 -w 0)
      return
    fi
  fi

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
  # Delete the old secret
  deleteSecret "key" ${RELEASE_REVISION}
  deleteSecret "cert" ${RELEASE_REVISION}
  exit 0
fi

###############################################################################################################################
# Encryption key
###############################################################################################################################

KEY=""

# If RELEASE_REVISION is 1 then this is a new install
# Otherwise it is an upgrade and we need to read the previous secret and
# migrate it to a new secret and change the values if needed

if [ ${RELEASE_REVISION} -eq 1 ]; then
  # Check whether the secret already exists
  echo "Fresh installation - checking encryption key secret does not already exist ..."
  curl -k -s \
      --fail \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H 'Content-Type: application/json' \
      ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-key-${RELEASE_REVISION} > ./key.json 2>&1

  EXISTS=$?
  if [ $EXISTS -eq 0 ]; then
    KEY=$(cat key.json | jq -r .data.key)
    echo "Read Encryption Key from previous secret (although was not expecting this secret to be present)"    
    deleteSecret "key" ${RELEASE_REVISION}
  else
    echo "Fresh installation - generating a new Encryption Key"
    # Generate a random encryption key
    KEY=$(openssl enc -aes-256-cbc -k secret -P -md sha1 | grep key | cut -d '=' -f2 | base64 -w 0)
  fi
  rm -f key.json
else
  echo "Upgrade - Looking for previous secret to migrate"
  PREVIOUS_REVISION=$(($RELEASE_REVISION - 1))

  # Check whether the secret already exists
  curl -k -s \
      --fail \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H 'Content-Type: application/json' \
      ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-key-${PREVIOUS_REVISION} > ./key.json 2>&1

  EXISTS=$?
  if [ $EXISTS -ne 0 ]; then
    # This could be an upgrade from a version that did NOT have the config-init job
    # Look for the encryption key volume

    echo "Could not find existing Encryption Key Secret - checking volume"
    if [ ${ENCRYPTION_KEY_VOLUME} -a ${ENCRYPTION_KEY_FILENAME} ]; then
      ekFile="${ENCRYPTION_KEY_VOLUME}/${ENCRYPTION_KEY_FILENAME}"
      if [ -f "${ekFile}" ]; then
        echo "Found encryption key file on the legacy encryption key volume"
        KEY=$(cat ${ekFile} | base64 -w 0)
      else
        echo "Could not read encryption key file from legacy encryption key volume"
        exit 1
      fi
    else
      echo "Encryption Key secret does not exist - this should have been created by a previous installation or upgrade"
      echo "Generating a new one - this may result in existing tokens not being usable"
      KEY=$(openssl enc -aes-256-cbc -k secret -P -md sha1 | grep key | cut -d '=' -f2 | base64 -w 0)
    fi
  else
    KEY=$(cat key.json | jq -r .data.key)
    echo "Read Encryption Key from previous secret"

    # Only delete the previous secret if it already exists
    deleteSecret "key" ${PREVIOUS_REVISION}
  fi

  rm -f key.json
fi

# We will create a new secret for the encryption key
cat << EOF > create-key-secret.yaml
{
  "kind": "Secret",
  "apiVersion": "v1",
  "type": "Opaque",
  "metadata": {
    "name": "@@NAME@@"
  },
  "data": {
    "key": "@@KEY@@"
  }
}
EOF

NAME="${RELEASE_NAME}-key-${RELEASE_REVISION}"

sed -i.bak "s/@@NAME@@/${NAME}/g" create-key-secret.yaml
sed -i.bak "s/@@KEY@@/${KEY}/g" create-key-secret.yaml

echo "Creating secret for the Encryption Key: ${RELEASE_NAME}-key-${RELEASE_REVISION}"

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

###############################################################################################################################
# TLS Certificate
###############################################################################################################################

echo "Checking TLS Certificate ..."

# Start with these empty to indicate we won't create a secret for the TLS certificate
CERT_CRT=""
CERT_KEY=""

if [ ${RELEASE_REVISION} -eq 1 ]; then
  echo "Fresh installation - checking whether we need to generate a certificate"

  # If CONSOLE_TLS_SECRET_NAME is set, then we don't need to create a certificate
  if [ -n "${CONSOLE_TLS_SECRET_NAME}" ]; then
    echo "Console is using secret ${CONSOLE_TLS_SECRET_NAME} to provide TLS certificate - nothing to do"
  else
    # Need a new certificate
    echo "New certificate needed ..."
    generateCert
    echo "${CERT_CRT}"
    echo "${CERT_KEY}"
  fi
else
  echo "Upgrade - checking whether we need to generate a certificate"

  # If we have a TLS Secret name, then we don't need the generated cert - so delete the previous one, if there was one
  if [ -n "${CONSOLE_TLS_SECRET_NAME}" ]; then
    echo "Console is using secret ${CONSOLE_TLS_SECRET_NAME} to provide TLS certificate - removing previous generated certificate (if any)"
    PREVIOUS_REVISION=$(($RELEASE_REVISION - 1))

    # Note: This will log an error if the certificate was not previously created - we just safely ignore this
    echo "Trying to delete previous generated secret if there was one ..."
    deleteSecret "cert" ${PREVIOUS_REVISION}
  else
    # Try and get the previous cert secret - if there isn't one, then possibly the user switched from providing us one
    # to wanting us to generate one
    curl -k -s \
        --fail \
        -H "Authorization: Bearer $KUBE_TOKEN" \
        -H 'Content-Type: application/json' \
        ${KUBE_API_SERVER}/api/v1/namespaces/${NAMESPACE}/secrets/${RELEASE_NAME}-cert-${PREVIOUS_REVISION} > ./cert.json 2>&1

    EXISTS=$?
    if [ $EXISTS -ne 0 ]; then
      echo "Could not find previous cert secret - will create a new one"
      # Need a new certificate
      generateCert
      echo "${CERT_CRT}"
      echo "${CERT_KEY}"
    else
      echo "Found previous secret ... going to use it"

      cat cert.json
      # Just copy the secret over with a new name
      CERT_CRT=$(cat cert.json | jq -r '.data["tls.crt"]')
      CERT_KEY=$(cat cert.json | jq -r '.data["tls.key"]')

      echo "Read Certificate from previous secret"
      echo ${CERT_CRT}
      echo ${CERT_KEY}
      rm -rf cert.json

      # Only delete the previous secret if it already exists
      deleteSecret "cert" ${PREVIOUS_REVISION}
    fi
  fi
fi

# If we have CERT_CRT and CERT_KEY then we need to create a new certificate
if [ -z "${CERT_CRT}" ] && [ -z "${CERT_KEY}" ]; then
  echo "CERT_CRT and CERT_KEY are empty - nothing to do"
else
  echo "CERT_CRT and CERT_KEY are NOT empty - going to create secret"

  # We will create a new secret for the certificate
  cat << EOF > create-cert-secret.yaml
  {
    "kind": "Secret",
    "apiVersion": "v1",
    "type": "kubernetes.io/tls",
    "metadata": {
      "name": "@@NAME@@"
    },
    "data": {
      "tls.crt": "@@CRT@@",
      "tls.key": "@@KEY@@"
    }
  }
EOF

  NAME="${RELEASE_NAME}-cert-${RELEASE_REVISION}"

  sed -i.bak "s/@@NAME@@/${NAME}/g" create-cert-secret.yaml
  sed -i.bak "s/@@CRT@@/${CERT_CRT}/g" create-cert-secret.yaml
  sed -i.bak "s/@@KEY@@/${CERT_KEY}/g" create-cert-secret.yaml

  # Create secret for the Certificate
  echo "Creating secret for the Certificate: ${RELEASE_NAME}-cert-${RELEASE_REVISION}"
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

echo ""
echo "============================================"
echo "Stratos init job complete"
echo "============================================"
