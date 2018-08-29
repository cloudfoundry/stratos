#!/bin/bash
set -e

if [ "${NO_SHARED_MODE}" = "true" ]; then
  /run-preflight-job.sh
fi

/srv/jetstream
