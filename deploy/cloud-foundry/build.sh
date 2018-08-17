#!/bin/bash

set -e

BUILD_DIR=$1
CACHE_DIR=$2

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

VENDOR_FOLDER=tmp/go/src/github.com/cloudfoundry-incubator/stratos/vendor

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

log "Fetching front-end dependencies" $CYAN

npm install
npm run customize

log "Building front-end" $CYAN
npm run build-cf

# Restore cached go vendor folder if there is one
if [ -d $CACHE_DIR/go-vendor ]; then
  log "Restoring vendor folder" $YELLOW
  mkdir -p ${VENDOR_FOLDER}
  cp -R $CACHE_DIR/go-vendor/* ${VENDOR_FOLDER}
fi

# Build backend (and fetch dependencies)
log "Building back-end" $CYAN
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
if [ -d ${VENDOR_FOLDER} ]; then
  log "Storing vendor folder" $YELLOW
  # Remove existing vendor cache if there is one
  rm -rf $CACHE_DIR/go-vendor
  mkdir -p $CACHE_DIR/go-vendor
  cp -R ${VENDOR_FOLDER}/* $CACHE_DIR/go-vendor
fi

# Remove transient folders used during build
rm -rf ./node_modules
rm -rf ./tmp

log "Disk usage for cache and app folders:" $CYAN

du -h -c --summarize ${CACHE_DIR}
du -h -c --summarize ${BUILD_DIR}

log "All done" $CYAN $BOLD
