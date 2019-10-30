#!/bin/bash

echo "============================================"
echo "Stratos Configuration Init Job"
echo "============================================"
echo ""
echo "Generating/Rotating Secrets"
echo ""

env

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
  echo "Fresh installation - generating a new Encryption Key"

  # Generate a random encryption key
  KEY=$(openssl enc -aes-256-cbc -k secret -P -md sha1 | grep key | cut -d '=' -f2 | base64 -w 0)
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
        echo "Could not read encrpytion key file from legacy encryption key volume"
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

# Patch secret for the Encryption Key
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

echo ""
echo "Stratos init job complete"
