#!/bin/bash

set -e

echo "Running e2e tests..."

cd deploy

cat << EOF > ../build/secrets.json
{
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
    "port": "4443",
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

docker version

docker pull splatform/stratos-uaa

docker build -f ./Dockerfile.all-in-one . -t stratos-ui

docker run -d -p 8080:8080 splatform/stratos-uaa

docker run -d -p 4443:443 stratos-ui

npm run e2e:nocov



