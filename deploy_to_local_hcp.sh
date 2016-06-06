#!/usr/bin/env bash
set -eu

TAG=tag-20160606T202654Z
SVC_DEFN=${TAG}/cnap-console-service-definition.json
INS_DEFN=${TAG}/cnap-console-instance-definition.json
MASTER_IP=192.168.200.2
NODE_IP=192.168.200.3

# Get service port
SERVICE_PORT=$(curl -Ss http://${MASTER_IP}:8080/api/v1/namespaces/ucp/services/ipmgr | jq '.spec.ports[0].nodePort')
echo "Service Port: $SERVICE_PORT"

# Post SDL
curl -H "Content-Type: application/json" -X POST -d @${SVC_DEFN} http://${NODE_IP}:${SERVICE_PORT}/v1/services

sleep 5

# Post Instance
curl -H "Content-Type: application/json" -X POST -d @${INS_DEFN} http://${NODE_IP}:${SERVICE_PORT}/v1/instances
