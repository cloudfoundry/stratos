#!/bin/bash

#set -e

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

#docker pull splatform/stratos-uaa

echo "Generating certificate"

./deploy/tools/generate_cert.sh

echo "Building images"
#docker build -f deploy/Dockerfile.all-in-one . -t stratos-ui

#./deploy/docker-compose/build.sh -n -l &> build_log.log
./deploy/docker-compose/build.sh -n -l

echo "Build Finished"

docker images

echo "Running Console in Docker Compose"

pushd deploy/ci/travis
docker-compose up -d
popd

ls -al
ls ./node_modules/.bine
echo $PATH

echo "Running tests"
npm run e2e:nocov

#docker logs stratos-ui
