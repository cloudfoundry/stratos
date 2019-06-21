#!/bin/bash
set -e

MAILCATCHER=$1

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

chmod +x ${DIRPATH}/deploy/ci/travis/run-e2e-tests.sh
# We will install ffmpeg so we can capture a video of the display as the tests run
sudo add-apt-repository -y ppa:mc3man/trusty-media
sudo apt-get -qq update

if [ "${MAILCATCHER}" == "true" ]; then
  docker run -d -p 1080:80 -p 1025:25 --name mail tophfr/mailcatcher
fi
