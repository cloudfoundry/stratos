#!/usr/bin/env bash

HCP_SVC_DOMAIN=".${HCP_SERVICE_DOMAIN_SUFFIX}.${HCP_DOMAIN_SUFFIX}"

echo "Stackato Console Stolon Startup Script"

function modifyEndpoints()
{
  # Add domain name to the endpoints
ENDPOINTS=""
IFS=',' read -ra ADDR <<< "$1"
for i in "${ADDR[@]}"; do
    HOST="${i%:*}"
    PORT="${i#*:}"
    ENDPOINTS=$ENDPOINTS,$HOST$HCP_SVC_DOMAIN:$PORT
done
ENDPOINTS=${ENDPOINTS#","}
}

if [ ! -z ${STKEEPER_STORE_ENDPOINTS} ]; then
  modifyEndpoints $STKEEPER_STORE_ENDPOINTS
  export STKEEPER_STORE_ENDPOINTS="$ENDPOINTS"
  echo "Modified STKEEPER_STORE_ENDPOINTS=${STKEEPER_STORE_ENDPOINTS}"
fi

if [ ! -z ${STPROXY_STORE_ENDPOINTS} ]; then
  modifyEndpoints $STPROXY_STORE_ENDPOINTS
  export STPROXY_STORE_ENDPOINTS="$ENDPOINTS"
  echo "Modified STPROXY_STORE_ENDPOINTS=${STPROXY_STORE_ENDPOINTS}"
fi

if [ ! -z ${STSENTINEL_STORE_ENDPOINTS} ]; then
  modifyEndpoints $STSENTINEL_STORE_ENDPOINTS
  export STSENTINEL_STORE_ENDPOINTS="$ENDPOINTS"
  echo "Modified STSENTINEL_STORE_ENDPOINTS=${STSENTINEL_STORE_ENDPOINTS}"
fi

/usr/local/bin/run.sh
