#!/bin/bash
# Note, don't set -e as we'll want to upload error'd tests on failure

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"
echo Starting e2e suite \'$1\'

${DIRPATH}/deploy/ci/travis/fetch-depcache.sh
if [ $? -ne 0 ]; then
    exit 1
fi

${DIRPATH}/deploy/ci/travis/run-e2e-tests.sh video $1
TEST_PASSED=$?

${DIRPATH}/deploy/ci/travis/upload-e2e-test-report.sh
UPLOADED_RES=$?

if [ $TEST_PASSED -ne 0 ] || [ $UPLOADED_RES -ne 0 ]; then
    exit 1
fi
