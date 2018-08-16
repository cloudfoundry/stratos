#!/bin/bash

set -e

BUILD_DIR=$1
CACHE_DIR=$2

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

function log {
  COLOR=${2:-}
  STYLE=${3:-}
  echo -e $COLOR$STYLE$1$RESET
}

log "Preparing application folder for Cloud Foundry deployment" $CYAN $BOLD

CF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOP_LEVEL=${CF_DIR}/../../

export STRATOS_TEMP=$(mktemp -d)

# Copy the config file
cp ${CF_DIR}/config.properties ${TOP_LEVEL}

cd ${TOP_LEVEL}

npm install
npm run customize

npm run build-cf

# Restore cached go vendor folder if there is one
if [ -d $CACHE_DIR/go-vendor ]; then
  log "Restoring vendor folder" $YELLOW
  cp -R $CACHE_DIR/go-vendor ./vendor 
fi

# Build backend (and fetch dependencies)
./build/bk-build.sh

# Copy backend executable here
cp outputs/portal-proxy .

# Back-end serves static resources from ui folder not dist
mv dist ui

# Ensure executable can be run (should be)
chmod +x portal-proxy

# Clean up build folders
rm -rf ./dist
rm -rf ./outputs

# Store dep cache
if [ -d ./vendor ]; then
  log "Storing vendor folder" $YELLOW
  cp -R ./vendor $CACHE_DIR/go-vendor
fi

# Remove files and folders not needed for running the app
rm -rf ./build
rm -rf ./src
rm -rf ./vendor
rm -rf ./node_modules
rm -rf ./tmp
rm -rf angular.json
rm -rf index.yaml
rm -rf Gopkg.*
rm -rf package.json
rm -rf .??*
rm -rf *.json
rm -rf *.js
rm -rf *.md

# List app contents at the top-level
echo "App folder (top-level)"
ls -al

log "All done" $CYAN $BOLD

echo "Disk usage for cache and app folders:"

du -h -c --summarize ${CACHE_DIR}
du -h -c --summarize ${BUILD_DIR}
