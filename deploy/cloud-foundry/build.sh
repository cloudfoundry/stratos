#!/bin/bash

set -e

echo "Preparing application folder for Cloud Foundry deployment"

CF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOP_LEVEL=${CF_DIR}/../../
BOWER_PATH=${NODE_HOME}/bin

export STRATOS_TEMP=$(mktemp -d)

# Copy the config file
cp ${CF_DIR}/config.properties ${TOP_LEVEL}

mv ${TOP_LEVEL}/plugins.json ${TOP_LEVEL}/plugins.json.bk
sed '2 a"cloud-foundry-hosting",' ${TOP_LEVEL}/plugins.json.bk > ${TOP_LEVEL}/plugins.json

# Hack for deleting testImports in glide files
# because unfortunately `glide install --skip-test` doesn't seem to work
find . -name glide.lock -exec sed -i '/^testImports.*/q' {} \;
find . -name glide.lock -exec sed -i 's/^testImports:$/testImports: []/g' {} \;

npm install -g gulp bower

cd ${TOP_LEVEL}

npm install --only=prod
${BOWER_PATH}/bower install

# Fetch Glide dependencies, since this is I/O intensive
# it won't interfere with UI build
npm run cf-get-backend-deps

npm run build

# Build backend components
npm run cf-build-backend

npm run build-cf

chmod +x portal-proxy

# Get the goose db migration tool

export DB_MIGRATE_DIR="$CF_DIR/db-migration"

export GOPATH=${DB_MIGRATE_DIR}/goose
export GOBIN=${DB_MIGRATE_DIR}/bin

go get bitbucket.org/liamstask/goose/cmd/goose

ls -al ${DB_MIGRATE_DIR}
ls -al ${DB_MIGRATE_DIR}/bin

# Build the migration helper
pushd ${DB_MIGRATE_DIR}
go build -o ParseVcapServices
popd