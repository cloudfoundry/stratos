#!/bin/bash

set -e

echo "Stratos e2e tests"
echo "================="

echo "Checking docker version"

docker version
docker-compose version

echo "Preparing for e2e tests..."

curl -sLk -o ./secrets.yaml https://travis.capbristol.com/yaml

echo "Generating certificate"
export CERTS_PATH=./dev-certs
./deploy/tools/generate_cert.sh

# There are two ways of running - building and deploying a full docker-compose deployment
# or doing a local build and running that with sqlite

# Single arg if set to 'video' will use ffmpeg to capture the browser window as a video as the tests run
CAPTURE_VIDEO=$1

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
# Start a local UAA - this will take a few seconds to come up in the background
docker run -d -p 8080:8080 splatform/stratos-uaa

# Get go 1.0 and dep
curl -sL -o ~/bin/gimme https://raw.githubusercontent.com/travis-ci/gimme/master/gimme
chmod +x ~/bin/gimme
eval "$(gimme 1.9)"
curl https://raw.githubusercontent.com/golang/dep/master/install.sh | sh
go version
dep version

npm run build
npm run build-backend
# Copy travis config.properties file
cp deploy/ci/travis/config.properties src/jetstream/
pushd src/jetstream
./jetstream > backend.log &
popd

E2E_TARGET="e2e -- --dev-server-target= --base-url=https://127.0.0.1:5443"

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
