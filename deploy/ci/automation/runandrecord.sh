#!/bin/bash

# Test URL
URL=$1

# Optional test suite argument
SUITE=$2

echo "====================================================================="
echo "Running E2E tests"
echo "====================================================================="

echo "Updating web driver based on Chrome version ..."
CHROME_VERSION=$(google-chrome --version | grep -iEo "[0-9.]{10,20}")
echo "Chrome version: ${CHROME_VERSION}"
npm run update-webdriver -- --versions.chrome=${CHROME_VERSION}

echo "Test suite: $SUITE"
echo "Test URL  : $URL"

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIRPATH/../../.."

export E2E_REPORT_FOLDER=./e2e-reports
export DISPLAY=:99.0
mkdir -p "${E2E_REPORT_FOLDER}"
echo "Starting ffmpeg to capture screen as video"
ffmpeg -video_size 1366x768 -framerate 25 -f x11grab -draw_mouse 0 -i :99.0 "${E2E_REPORT_FOLDER}/ScreenCapture.mp4" > "${E2E_REPORT_FOLDER}/ffmpeg.log" 2>&1 &
FFMPEG=$!

# Need to set base URL via env var
export STRATOS_E2E_BASE_URL=${URL}

export STRATOS_E2E_LOG_TIME=true
./node_modules/.bin/ng e2e --no-webdriver-update --dev-server-target= --base-url=${URL} ${SUITE}
RESULT=$?

echo "Stopping video capture"
kill -INT $FFMPEG
sleep 10

exit $RESULT
