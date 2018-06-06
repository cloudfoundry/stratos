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

# There are two ways of running - building and deploying a full docker-compose deploymenty
# or doing a local build and running that with sqlite


if [ "${TRAVIS_EVENT_TYPE}" == "pull_request" ]; then
  echo "Pull Request: Using local deployment for e2e tests"
  # Quick deploy locally
  # Start a local UAA - this will take a few seconds to come up in the background
  docker run -d -p 8080:8080 splatform/stratos-uaa
  npm run build
  npm run build-backend-dev
  # Patch the config file so local version runs on port 443
  pushd outputs
  sed -i "s/5443/443/g" config.properties
  ./portal-proxy > backend.log 2>&1
  popd
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

set +e
echo "Running e2e tests"
npm run e2e-local
RESULT=$?
set -e

if [ "${TRAVIS_EVENT_TYPE}" != "pull_request"]; then
  pushd deploy/ci/travis
  # Uncomment to copy logs to the travis log
  #docker-compose stop
  #docker-compose logs mariadb
  #docker-compose logs goose
  #docker-compose logs proxy 
  docker-compose down
  popd
fi

# Check environment variable that will ignore E2E failures
if [ -n "${STRATOS_ALLOW_E2E_FAILURES}" ]; then
  echo "Ignoring E2E test failures (if any) because STRATOS_ALLOW_E2E_FAILURES is set"
  exit 0
fi

exit $RESULT
