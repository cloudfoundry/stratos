#!/bin/bash

set -e

echo "Stratos e2e test report upload"
echo "=============================="

if [ -z "${AWS_ENDPOINT}" ]; then
  echo "Need S3 endpoint URL"
  exit 1
fi

wget https://dl.minio.io/client/mc/release/linux-amd64/mc
chmod +x mc

echo "Uploading test report...."

./mc config host add e2e-reports ${AWS_ENDPOINT} ${AWS_ACCESS_KEY_ID} ${AWS_SECRET_ACCESS_KEY} 

# Sync the E2E reports
./mc cp -r ./e2e-reports e2e-reports/${S3_BUCKET}
