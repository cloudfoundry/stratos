#!/bin/bash

set -e

echo "Stratos e2e tests"
echo "================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

echo "Checking docker version"

docker version

echo "Preparing for e2e tests..."

wget https://travis.capbristol.com/yaml --no-check-certificate -O ./secrets.yaml

echo "Generating certificate"
export CERTS_PATH=./dev-certs
./deploy/tools/generate_cert.sh

# Single arg if set to 'video' will use ffmpeg to capture the browser window as a video as the tests run
CAPTURE_VIDEO=$1

# If suite is set, use it else use default `e2e`
SUITE=$2
if [ -z "$SUITE" ]; then
  SUITE="e2e"
fi

# Test report folder name override
TIMESTAMP=`date '+%Y%m%d-%H.%M.%S'`

export E2E_REPORT_FOLDER="./e2e-reports/${TIMESTAMP}-Travis-Job-${TRAVIS_JOB_NUMBER}"
mkdir -p "${E2E_REPORT_FOLDER}"

if [ "$CAPTURE_VIDEO" == "video" ]; then
  echo "Starting background install of ffmpeg"
  sudo apt-get install -y ffmpeg > ${E2E_REPORT_FOLDER}/ffmpeg-install.log &
  FFMPEG_INSTALL_PID=$!
fi

echo "Using local deployment for e2e tests"
# Quick deploy locally

# Build if needed or use existing build for this commit
DIRNAME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set +e
source "${DIRNAME}/e2e-build-script.sh"
set -e

# Copy travis config.properties file
cp deploy/ci/travis/config.properties src/jetstream/
pushd src/jetstream
./jetstream > backend.log &
popd

CHROME_VERSION=$(google-chrome --version | grep -iEo "[0-9.]{10,20}")
echo "Chrome version: ${CHROME_VERSION}"

npm run update-webdriver -- --versions.chrome=${CHROME_VERSION}

export STRATOS_E2E_BASE_URL="https://127.0.0.1:5443"

E2E_TARGET="e2e -- --no-webdriver-update --dev-server-target= --base-url=https://127.0.0.1:5443 --suite=${SUITE}"

# Set Stratos debug if running a PR with the appropriate label
source "${DIRPATH}/deploy/ci/travis/check-e2e-pr.sh"

# Capture video if configured
if [ "$CAPTURE_VIDEO" == "video" ]; then
  echo "Waiting for ffmpeg install to complete..."
  wait ${FFMPEG_INSTALL_PID}
  echo "Starting video capture"
  ffmpeg -video_size 1366x768 -framerate 25 -f x11grab -draw_mouse 0 -i :99.0 ${E2E_REPORT_FOLDER}/ScreenCapture.mp4 >/dev/null 2>&1 &
  FFMPEG=$!
fi

set +e
echo "Running e2e tests"
npm run ${E2E_TARGET}
RESULT=$?
set -e

# Copy the backend log to the test report folder if the tests failed
if [ $RESULT -ne 0 ]; then
  cp src/jetstream/backend.log ${E2E_REPORT_FOLDER}/jetstream.log
fi

if [ "$CAPTURE_VIDEO" == "video" ]; then
  echo "Stopping video capture"
  kill -INT $FFMPEG
fi

# Check environment variable that will ignore E2E failures
if [ -n "${STRATOS_ALLOW_E2E_FAILURES}" ]; then
  echo "Ignoring E2E test failures (if any) because STRATOS_ALLOW_E2E_FAILURES is set"
  exit 0
fi

exit $RESULT
