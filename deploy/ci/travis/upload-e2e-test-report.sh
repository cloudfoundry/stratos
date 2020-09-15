#!/bin/bash

echo "Stratos e2e test report upload"
echo "=============================="

if [ -z "${AWS_ENDPOINT}" ]; then
  echo "S3 endpoint URL needed to upload reports"
  exit 0
fi

DIRNAME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRNAME}/e2e-mc-helper.sh"

echo "Uploading test report ..."

# Sync the E2E reports
mc cp -q --insecure -r e2e-reports s3/${S3_BUCKET}

if [[ $? != 0 ]]; then
  echo 'Error uploading test reports: $?'
fi

# Test report upload failure will not fail the Travis job
exit 0
