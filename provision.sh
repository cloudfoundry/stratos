#!/bin/sh

WORK_DIR=$(pwd)
TOOLS_DIR="$WORK_DIR/tools"

# We need java for the closure compiler
type java > /dev/null 2>&1
apt-get update && apt-get install -y openjdk-7-jre

cd ${TOOLS_DIR}
npm install
PATH=$PATH:$TOOLS_DIR/node_modules/.bin
bower install --allow-root --force
npm run build
