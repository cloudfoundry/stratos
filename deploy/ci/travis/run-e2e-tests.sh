#!/bin/bash

set -e

echo "Running e2e tests..."

cat << EOF > ./build/secrets.json
{
  "headless": true,
  "cloudFoundry": {
    "url": "${CF_LOCATION}",
    "admin": {
      "username": "${CF_ADMIN_USER}",
      "password": "${CF_ADMIN_PASSWORD}"
    },
    "user": {
      "username": "${CF_E2E_USER}",
      "password": "${CF_E2E_USER_PASSWORD}"
    }
  },
  "console": {
    "host": "localhost",
    "port": "443",
    "admin": {
      "username": "${CONSOLE_ADMIN_USER}",
      "password": "${CONSOLE_ADMIN_PASSWORD}"
    },
    "user": {
      "username": "${CONSOLE_USER_USER}",
      "password": "${CONSOLE_USER_PASSWORD}"
    }
  },
  "uaa": {
    "url": "http://uaa:8080",
    "clientId": "console",
    "adminUsername": "admin",
    "adminPassword": "hscadmin"
  }
}
EOF

echo "Generating certificate"
export CERTS_PATH=./dev-certs
./deploy/tools/generate_cert.sh

echo "Building images locally"
./deploy/docker-compose/build.sh -n -l
echo "Build Finished"
docker images

echo "Running Console in Docker Compose"
pushd deploy/ci/travis
docker-compose up -d
popd

# The build cleared node_modules, so install again (should be from cache)
npm install

echo "Running e2e tests"
npm run e2e:nocov