#!/bin/bash

set -e

BUILD_DIR=$1
CACHE_DIR=$2

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

# Fetch Glide dependencies
npm run cf-get-backend-deps

npm run build

# Build backend components
npm run cf-build-backend

npm run build-cf

chmod +x portal-proxy

# Get the goose db migration tool
export DB_MIGRATE_DIR="$CF_DIR/db-migration"
export DB_DIR="$CF_DIR/../db/migrations"
export GOPATH=${CACHE_DIR}/migration
mkdir -p $GOPATH

go get bitbucket.org/liamstask/goose/lib/goose
go get github.com/lib/pq
go get github.com/mattn/go-sqlite3

# Build the migration tool
pushd ${DB_DIR}
go build -o migrateStratosDb
echo "Built DB migrator"
popd


# Build the migration helper
pushd ${DB_MIGRATE_DIR}
go build -o parseVcapServices
popd

# Clean up build folders
rm -rf ./dist
rm -rf ./outputs

# Don't need the source code after build
rm -rf ./components

echo "All done"

echo "Disk usage for cache and app folders:"

du -h -c --summarize ${CACHE_DIR}
du -h -c --summarize ${BUILD_DIR}
