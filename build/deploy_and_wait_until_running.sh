#!/usr/bin/env bash

set -eu

# Get service port

SERVICE_PORT=$(curl -Ss http://192.168.200.2:8080/api/v1/namespaces/ucp/services/ipmgr | jq '.spec.ports[0].nodePort')
echo "Service Port: $SERVICE_PORT"

# Post SDL
curl -H "Content-Type: application/json" -X POST -d @ucp/definition/cnap-console-service-definition.json http://192.168.200.3:${SERVICE_PORT}/v1/services

sleep 5

# Post Instance
curl -H "Content-Type: application/json" -X POST -d @ucp/instance/cnap-console-service-instance.json http://192.168.200.3:${SERVICE_PORT}/v1/instances
