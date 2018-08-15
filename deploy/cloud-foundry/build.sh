#!/bin/bash

set -e

BUILD_DIR=$1
CACHE_DIR=$2

echo "Preparing application folder for Cloud Foundry deployment"

CF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOP_LEVEL=${CF_DIR}/../../

export STRATOS_TEMP=$(mktemp -d)

# Copy the config file
cp ${CF_DIR}/config.properties ${TOP_LEVEL}

cd ${TOP_LEVEL}

npm install
npm run customize

npm run build-cf

# Build backend (and fetch dependencies)
./build/bk-build.sh

# Copy backend executable here
cp ./output/**/* .

# Back-end serves static resources from ui folder not dist
mv dist ui

# Ensure executable can be run (should be)
chmod +x portal-proxy

# Clean up build folders
rm -rf ./dist
rm -rf ./outputs

# Don't need the source code after build
rm -rf ./src

echo "All done"

echo "Disk usage for cache and app folders:"

du -h -c --summarize ${CACHE_DIR}
du -h -c --summarize ${BUILD_DIR}
