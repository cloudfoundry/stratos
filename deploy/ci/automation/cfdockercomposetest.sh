#!/bin/bash


echo "=============================="
echo "Stratos Docker Compose Test"
echo "=============================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRPATH}/cfutils.sh"

# We should be running in the Stratos GitHub folder

pwd

echo "Listing current docker containers:"
docker ps

set -e

echo "Building images locally"
./build/store-git-metadata.sh
./deploy/docker-compose/build.sh -n -l
echo "Build Finished"
docker images

# Clean the E2E reports folder
rm -rf ./e2e-reports
mkdir -p ./e2e-reports
export E2E_REPORT_FOLDER=./e2e-reports
mkdir -p "${E2E_REPORT_FOLDER}/logs"

echo "Running Stratos in Docker Compose"
pushd deploy
#docker-compose -f docker-compose.development.yml up -d | tee "${E2E_REPORT_FOLDER}/logs/build.log"
docker-compose -f docker-compose.development.yml up -d
popd

# Get the E2E config
rm -f secrets.yaml
curl -k ${TEST_CONFIG_URL} --output secrets.yaml

# Need node modules to run the tests
rm -rf node_modules
npm install

# Run the E2E tests
"$DIRPATH/runandrecord.sh" https://localhost:443
RET=$?

set +e

pushd deploy

# Store logs if there was a test failure
if [ $RET -ne 0 ]; then
  docker-compose -f docker-compose.development.yml logs proxy > "${E2E_REPORT_FOLDER}/logs/jetstream.log"
  docker-compose -f docker-compose.development.yml logs db-migrator > "${E2E_REPORT_FOLDER}/logs/db-migrator.log"
  docker-compose -f docker-compose.development.yml logs nginx > "${E2E_REPORT_FOLDER}/logs/nginx.log"
  docker-compose -f docker-compose.development.yml logs mariadb > "${E2E_REPORT_FOLDER}/logs/mariadb.log"
fi

docker-compose -f docker-compose.development.yml down
popd

# Pause the PCF Dev instance for now
echo "Suspending PCF Dev"
cf pcfdev suspend
cf pcfdev status

# Return exit code form the e2e tests
exit $RET
