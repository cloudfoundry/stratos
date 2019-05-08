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

# Patch the docker compose file to run Stratos on a different port
rm -f docker-compose.testing.yml
rm -f common.testing.yml
rm -f *.bak
sed -e 's/80:80/2080:80/g' common.yml > common.testing.yml
sed -i.bak -e 's/443:443/2443:443/g' common.testing.yml
sed -e 's/file: common.yml/file: common.testing.yml/g' docker-compose.development.yml > docker-compose.testing.yml

docker-compose -f docker-compose.testing.yml up -d
popd

echo "Docker Containers"
docker ps

# Wait for the UAA to become available
echo "Waiting 30 seconds for UAA to start up ..."
sleep 30

# Need node modules to run the tests
rm -rf node_modules
npm install

# Run the E2E tests
"$DIRPATH/runandrecord.sh" https://127.0.0.1:2443
RET=$?

set +e

pushd deploy

# Store logs if there was a test failure
if [ $RET -ne 0 ]; then
  docker-compose -f docker-compose.testing.yml logs proxy > "${E2E_REPORT_FOLDER}/logs/jetstream.log"
  docker-compose -f docker-compose.testing.yml logs db-migrator > "${E2E_REPORT_FOLDER}/logs/db-migrator.log"
  docker-compose -f docker-compose.testing.yml logs nginx > "${E2E_REPORT_FOLDER}/logs/nginx.log"
  docker-compose -f docker-compose.testing.yml logs mariadb > "${E2E_REPORT_FOLDER}/logs/mariadb.log"
fi

docker-compose -f docker-compose.testing.yml down
popd

echo "All done"

# Return exit code form the e2e tests
exit $RET
