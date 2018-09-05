#!/bin/bash

set -e

echo "Stratos e2e tests"
echo "================="

echo "Checking docker version"

docker version
docker-compose version

echo "Preparing for e2e tests..."

curl -sLk -o ./secrets.yaml https://travis.capbristol.com/yaml

echo "Generating certificate"
export CERTS_PATH=./dev-certs
./deploy/tools/generate_cert.sh

# There are two ways of running - building and deploying a full docker-compose deployment
# or doing a local build and running that with sqlite

E2E_TARGET="e2e-local"

# Single arg to script can change whether we do a quick of full deploy
RUN_TYPE=$1

if [ "${RUN_TYPE}" == "quick" ]; then
  echo "Using local deployment for e2e tests"
  # Quick deploy locally
  # Start a local UAA - this will take a few seconds to come up in the background
  docker run -d -p 8080:8080 splatform/stratos-uaa

  # Get go 1.0 and dep
  curl -sL -o ~/bin/gimme https://raw.githubusercontent.com/travis-ci/gimme/master/gimme
  chmod +x ~/bin/gimme
  eval "$(gimme 1.9)"
  curl https://raw.githubusercontent.com/golang/dep/master/install.sh | sh
  go version
  dep version
  
  npm run build
  npm run build-backend
  # Copy travis config.properties file
  cp deploy/ci/travis/config.properties src/jetstream/
  pushd src/jetstream
  ./jetstream > backend.log &
  popd

  E2E_TARGET="e2e -- --dev-server-target= --base-url=https://127.0.0.1:5443"
else
  echo "Using docker-compose deployment for e2e tests"
  # Full deploy in docker compose - this is slow
  # Move the node_modules folder - the docker build will remove it anyway
  mv ./node_modules /tmp/node_modules

  echo "Building images locally"
  ./deploy/docker-compose/build.sh -n -l
  echo "Build Finished"
  docker images

  echo "Running Stratos in Docker Compose"
  pushd deploy/ci/travis
  docker-compose up -d
  popd

  # The build cleared node_modules, so move back the one we kept
  #npm install
  rm -rf ./node_modules
  mv /tmp/node_modules ./node_modules
fi

# Test report folder name override
TIMESTAMP=`date '+%Y%m%d-%H.%M.%S'`
export E2E_REPORT_FOLDER='./e2e-reports/${TIMESTAMP}-Travis-Job-${TRAVIS_JOB_NUMBER}'

set +e
echo "Running e2e tests"
npm run ${E2E_TARGET}
RESULT=$?
set -e

if [ "${TRAVIS_EVENT_TYPE}" != "pull_request" ]; then
  pushd deploy/ci/travis
  # Uncomment to copy logs to the travis log
  #docker-compose stop
  #docker-compose logs mariadb
  #docker-compose logs goose
  #docker-compose logs proxy 
  docker-compose down
  popd
fi

# Copy the backend log to the test report folder if the tests failed
if [ "${RUN_TYPE}" == "quick" ]; then
  if [ $RESULT -ne 0 ]; then
    cp src/jetstream/backend.log ${E2E_REPORT_FOLDER}/jetstream.log
  fi
fi

# Check environment variable that will ignore E2E failures
if [ -n "${STRATOS_ALLOW_E2E_FAILURES}" ]; then
  echo "Ignoring E2E test failures (if any) because STRATOS_ALLOW_E2E_FAILURES is set"
  exit 0
fi

exit $RESULT
