#!/bin/bash


echo "=============================="
echo "Stratos Docker All-in-one Test"
echo "=============================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRPATH}/cfutils.sh"

# We should be running in the Stratos GitHub folder

pwd
set -e

IMAGE="stratos-aio"

# Build AIO image unless asked to use nightly image
if [ "$1" != "prebuilt" ]; then
  echo "Building AIO image locally"
  ./build/store-git-metadata.sh
  docker build --pull	-f deploy/Dockerfile.all-in-one . -t stratos-aio
else
  echo "Using Nightly published AIO image"
  IMAGE="splatform/stratos"
  # Ensure we pull the latest image
  docker pull $IMAGE
fi

echo "Running Stratos All-in-one"

CF=https://api.${CF_DOMAIN}
UAA=$(curl -k -s $CF | jq -r .links.uaa.href)

echo "Using UAA Endpoint: ${UAA}"

# Run the all-in-one Stratos
# Configure env to use the UAA provided by PCF dev
CONTAINER_ID=$(docker run \
-d \
-p 5443:443 \
-e CONSOLE_CLIENT='cf' \
-e UAA_ENDPOINT="${UAA}" \
-e SKIP_SSL_VALIDATION='true' \
-e CONSOLE_ADMIN_SCOPE='cloud_controller.admin' \
-e SMTP_HOST="${SMTP_HOST}" \
-e SMTP_FROM_ADDRESS="${SMTP_FROM_ADDRESS}" \
$IMAGE)

# Show backend log - wait a few seconds for it to start up

echo "Backend startup log ..."
sleep 20
docker logs ${CONTAINER_ID} | tail -n 100

echo "Preparing E2E Tests..."

# Need node modules to run the tests
rm -rf node_modules
npm install

# Clean the E2E reports folder
rm -rf ./e2e-reports
mkdir -p ./e2e-reports
export E2E_REPORT_FOLDER=./e2e-reports

# Run the E2E tests
"$DIRPATH/runandrecord.sh" https://localhost:5443
RET=$?

set +e

# Kill the docker container
docker kill $CONTAINER_ID

echo "All done"

# Return exit code form the e2e tests
exit $RET
