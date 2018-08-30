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

mkdir ./e2e-reports
echo "This is a test" > ./e2e-reports/test.txt
echo "This is a test" > ./e2e-reports/test2.txt
echo "This is a test" > ./e2e-reports/test3.txt

echo "Configuring upload client"
./mc config host add s3 ${AWS_ENDPOINT} ${AWS_ACCESS_KEY_ID} ${AWS_SECRET_ACCESS_KEY} --insecure

echo "Listing contents..."
./mc ls s3 --insecure

echo "Uploading ..."
# Sync the E2E reports
./mc cp --insecure -r ./e2e-reports s3/${S3_BUCKET}
