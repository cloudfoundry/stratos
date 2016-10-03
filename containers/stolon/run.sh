#!/usr/bin/env bash
set -o pipefail

echo "Stackato Console Stolon Startup Script"

function modifyNoProxy()
{
  if [ ! -z $1 ]; then
    # Add names to the NO PROXY environment variable
    IFS=',' read -ra ADDR <<< "$1"
    for i in "${ADDR[@]}"; do
      HOST="${i%:*}"
      PORT="${i#*:}"
      NO_PROXY=${NO_PROXY},${HOST}
    done
  fi
}

# Only do this if there is a proxy set
if [ ! -z ${HTTP_PROXY} ] || [ ! -z ${HTTPS_PROXY} ]; then
  echo "Running with a web proxy set - updating NO_PROXY"
  # We will append to NO_PROXY delimiting with "," - so make sure it has a value if there is not one
  if [ -z ${NO_PROXY} ]; then
    NO_PROXY="127.0.0.1"
  fi
  modifyNoProxy $STKEEPER_STORE_ENDPOINTS
  modifyNoProxy $STPROXY_STORE_ENDPOINTS
  modifyNoProxy $STSENTINEL_STORE_ENDPOINTS
  echo "NO_PROXY: ${NO_PROXY}"
  export NO_PROXY=${NO_PROXY}
fi

echo "Configure logging to FlightRecorder"
log_cmd=''
if [[ -n "$HCP_FLIGHTRECORDER_HOST" && -n "$HCP_FLIGHTRECORDER_PORT" ]]; then
  log_cmd="2>&1 | tee >(logger -n $HCP_FLIGHTRECORDER_HOST -P $HCP_FLIGHTRECORDER_PORT -t ${HOSTNAME} -u /tmp/ignored)"
  mkdir -p /etc/rsyslog.d
  echo "*.* @@${HCP_FLIGHTRECORDER_HOST}:${HCP_FLIGHTRECORDER_PORT}" > /etc/rsyslog.d/flight-recorder.conf
  /usr/sbin/rsyslogd
fi

cmd="/usr/local/bin/run.sh"
echo "etcd startup command to be executed: $cmd $log_cmd"

# Now run the Stolon start-up script
eval "$cmd $log_cmd"
