#!/bin/bash


echo "=============================="
echo "Stratos Docker Compose Test"
echo "=============================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRPATH}/cfutils.sh"

# We should be running in the Stratos GitHub folder

pwd

echo "Stopping previous Docker Compose (if any)"
pushd deploy
docker-compose -f docker-compose.development.yml down
popd

set -e

echo "Building images locally"
./build/store-git-metadata.sh
./deploy/docker-compose/build.sh -n -l
echo "Build Finished"
docker images

echo "Running Stratos in Docker Compose"
pushd deploy
docker-compose -f docker-compose.development.yml up -d
popd

# Get the E2E config
curl -k ${TEST_CONFIG_URL} --output secrets.yaml
echo "headless: true" >> secrets.yaml

# Need node modules to run the tests
rm -rf node_modules
npm install

# Clean the E2E reports folder
rm -rf ./e2e-reports
mkdir -p ./e2e-reports
export E2E_REPORT_FOLDER=./e2e-reports

# Run the E2E tests
./node_modules/.bin/ng e2e --dev-server-target= --base-url=https://localhost:443
RET=$?

set +e

pushd deploy
docker-compose -f docker-compose.development.yml down
popd

# Pause the PCF Dev instance for now
echo "Suspending PCF Dev"
cf pcfdev suspend
cf pcfdev status

# Return exit code form the e2e tests
exit $RET
