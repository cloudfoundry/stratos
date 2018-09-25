#!/bin/bash

SUITE=$1
echo "====================================================================="
echo "Running E2E tests"
echo "====================================================================="

echo $SUITE

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo $DIRPATH

export E2E_REPORT_FOLDER=./e2e-reports

cd $DIRPATH/../../..
./node_modules/.bin/ng e2e --dev-server-target= --base-url=https://console.local.pcfdev.io ${SUITE}
