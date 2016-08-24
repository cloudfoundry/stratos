#!/usr/bin/env bash
set -o pipefail

pushd etcd-v2.3.7-linux-amd64

HOST_NAME="hsc-etcd-${HCP_COMPONENT_INDEX}-int"
echo "This container is named: ${HOST_NAME}"

ADVERTISE_PEER_URLS="http://${HOST_NAME}:2380"
echo "Advertise peer URLs: ${ADVERTISE_PEER_URLS}"

ADVERTISE_CLIENT_URLS="http://${HOST_NAME}:2379"
echo "Advertise client URLs: ${ADVERTISE_CLIENT_URLS}"


LISTEN_PEER_URLS="http://0.0.0.0:2380"
echo "Listen peer URLs: ${LISTEN_PEER_URLS}"

LISTEN_CLIENT_URLS="http://0.0.0.0:2379"
echo "Listen client URLs: ${LISTEN_CLIENT_URLS}"

INITIAL_CLUSTER_TOKEN="hsc-etcd-cluster-1"
echo "Initial cluster token: ${INITIAL_CLUSTER_TOKEN}"

INITIAL_CLUSTER="hsc-etcd-0-int=http://hsc-etcd-0-int:2380,hsc-etcd-1-int=http://hsc-etcd-1-int:2380,hsc-etcd-2-int=http://hsc-etcd-2-int:2380"
echo "Initial cluster: ${INITIAL_CLUSTER}"

INITIAL_CLUSTER_STATE="new"
echo "Initial cluster state: ${INITIAL_CLUSTER_STATE}"


log_cmd=''
if [[ -n "$HCP_FLIGHTRECORDER_HOST" && -n "$HCP_FLIGHTRECORDER_PORT" ]]; then
  log_cmd="2>&1 | tee >(logger -t helion-stackato-console-etcd -n 127.0.0.1 -P 514)"
  mkdir -p /etc/rsyslog.d
  echo "*.* @@${HCP_FLIGHTRECORDER_HOST}:${HCP_FLIGHTRECORDER_PORT}" > /etc/rsyslog.d/flight-recorder.conf
  service rsyslog start
fi

cmd='ETCD_NAME=${HOST_NAME} ETCD_INITIAL_ADVERTISE_PEER_URLS=${ADVERTISE_PEER_URLS} ETCD_LISTEN_PEER_URLS=${LISTEN_PEER_URLS} ETCD_LISTEN_CLIENT_URLS=${LISTEN_CLIENT_URLS} ETCD_ADVERTISE_CLIENT_URLS=${ADVERTISE_CLIENT_URLS} ETCD_INITIAL_CLUSTER_TOKEN=${INITIAL_CLUSTER_TOKEN} ETCD_INITIAL_CLUSTER_STATE=${INITIAL_CLUSTER_STATE} ETCD_INITIAL_CLUSTER=${INITIAL_CLUSTER} ./etcd'

eval "$cmd $log_cmd"
