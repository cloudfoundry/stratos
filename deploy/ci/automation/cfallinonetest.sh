#!/bin/bash


echo "=============================="
echo "Stratos Docker All-in-one Test"
echo "=============================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRPATH}/cfutils.sh"

# We should be running in the Stratos GitHub folder

pwd
set -e

./build/store-git-metadata.sh
docker build --pull	-f deploy/Dockerfile.all-in-one . -t stratos-aio

echo "Running Stratos All-in-one"

# Run the all-in-one Stratos
# Configure env to use the UAA provided by PCF dev
CONTAINER_ID=$(docker run \
-d
-p 5443:443 \
-e CONSOLE_CLIENT='cf' \
-e UAA_ENDPOINT='http://localhost:8080' \
-e CONSOLE_ADMIN_SCOPE='cloud_controller.admin' \
stratos-aio)

# Get the E2E config
wget ${TEST_CONFIG_URL} -O secrets.yaml --no-check-certificate
echo "headless: true" >> secrets.yaml

# Need node modules to run the tests
rm -rf node_modules
npm install

# Clean the E2E reports folder
rm -rf ./e2e-reports
mkdir -p ./e2e-reports
export E2E_REPORT_FOLDER=./e2e-reports

# Run the E2E tests
./node_modules/.bin/ng e2e --dev-server-target= --base-url=https://localhost:5443
RET=$?

set +e

# Kill the docker container
docker kill $CONTAINER_ID

# Pause the PCF Dev instance for now
echo "Suspending PCF Dev"
cf pcfdev suspend
cf pcfdev status

# Return exit code form the e2e tests
exit $RET
