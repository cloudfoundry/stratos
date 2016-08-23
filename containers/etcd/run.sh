#!/usr/bin/env bash

set -o pipefail

ETCD_HOSTNAME=hsc-etcd-${HCP_COMPONENT_INDEX}-int
log_cmd=''
cmd='ETCD_NAME=$ETCD_HOSTNAME etcd'

# if [[ -n "$HCP_FLIGHTRECORDER_HOST" && -n "$HCP_FLIGHTRECORDER_PORT" ]]; then
#   log_cmd="2>&1 | tee >(logger -t helion-stackato-console -n 127.0.0.1 -P 514)"
#   mkdir -p /etc/rsyslog.d
#   echo "*.* @@${HCP_FLIGHTRECORDER_HOST}:${HCP_FLIGHTRECORDER_PORT}" > /etc/rsyslog.d/flight-recorder.conf
#   service rsyslog start
# fi

eval "$cmd $log_cmd"
