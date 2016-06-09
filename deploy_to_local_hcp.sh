#!/usr/bin/env bash
set -eu

# The IP address of the master & node VMs
MASTER_IP=192.168.200.2
NODE_IP=192.168.200.3

# The tagged release to deploy into HCP
TAG=$1
if [ -z "$1" ]
  then
    echo "You must supply the tag of a specific release to deply. No tag parameter supplied."
    exit 1
fi

# The fully qualified path to the definityion and instance files
SVC_DEFN=deploy_archives/${TAG}/cnap-console-service-definition.json
INS_DEFN=deploy_archives/${TAG}/cnap-console-service-instance.json


# Get service port
SERVICE_PORT=$(curl -Ss http://${MASTER_IP}:8080/api/v1/namespaces/ucp/services/ipmgr | jq '.spec.ports[0].nodePort')
echo "Service Port: $SERVICE_PORT"

# Post SDL
curl -H "Content-Type: application/json" -X POST -d @${SVC_DEFN} http://${NODE_IP}:${SERVICE_PORT}/v1/services

sleep 5

# Post Instance
curl -H "Content-Type: application/json" -X POST -d @${INS_DEFN} http://${NODE_IP}:${SERVICE_PORT}/v1/instances
