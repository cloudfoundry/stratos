#!/bin/bash
set -e

MAILCATCHER=$1

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

chmod +x ${DIRPATH}/deploy/ci/travis/run-e2e-tests.sh
# We will install ffmpeg so we can capture a video of the display as the tests run
# sudo apt-get update
# sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:mc3man/bionic-media
sudo apt-get -qq update

if [ "${MAILCATCHER}" == "true" ]; then
  docker run -d -p 1080:80 -p 1025:25 --name mail tophfr/mailcatcher
fi

# Start a local UAA - this will take a few seconds to come up in the background
docker run -d -p 8080:8080 splatform/stratos-uaa

# Check that the S3 server is available
if [ -n "${AWS_ENDPOINT}" ]; then
  curl -k --max-time 20 ${AWS_ENDPOINT}
  if [ $? -ne 0 ]; then
    echo "Can not contact S3 Server"
    exit 1
  fi
fi