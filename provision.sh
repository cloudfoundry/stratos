#!/bin/sh

WORK_DIR=$(pwd)
TOOLS_DIR="$WORK_DIR/tools"

cd ${TOOLS_DIR}
npm install
PATH=$PATH:$TOOLS_DIR/node_modules/.bin
bower install --force
npm run build
