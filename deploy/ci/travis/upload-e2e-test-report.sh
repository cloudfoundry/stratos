#!/bin/bash

set -e

echo "Stratos e2e test report upload"
echo "=============================="

if [ -z "${AWS_ENDPOINT}" ]; then
  echo "Need S3 endpoint URL"
  exit 1
fi

curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

echo "Uploading test report...."

# Sync the E2E reports to S3
aws --endpoint-url ${AWS_ENDPOINT} s3 sync ./e2e-reports s3://${S3_BUCKET}