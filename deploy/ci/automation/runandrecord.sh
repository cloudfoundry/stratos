#!/bin/bash

SUITE=$1
echo "====================================================================="
echo "Running E2E tests"
echo "====================================================================="

echo $SUITE

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo $DIRPATH

cd "$DIRPATH/../../.."
export E2E_REPORT_FOLDER=./e2e-reports

ffmpeg -video_size 1366x768 -framerate 25 -f x11grab -draw_mouse 0 -i :99.0 "${E2E_REPORT_FOLDER}/ScreenCapture.mp4" >/dev/null 2>&1 &
FFMPEG=$!

export STRATOS_E2E_LOG_TIME=true
./node_modules/.bin/ng e2e --dev-server-target= --base-url=https://console.local.pcfdev.io ${SUITE}
RESULT=$?

echo "Stopping video capture"
kill -INT $FFMPEG

exit $RESULT
