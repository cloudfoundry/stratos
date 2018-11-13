DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"
echo Starting e2e suite \'$1\'

${DIRPATH}/deploy/ci/travis/fetch-depcache.sh
${DIRPATH}/deploy/ci/travis/run-e2e-tests.sh video $1
${DIRPATH}/deploy/ci/travis/upload-e2e-test-report.sh
