#!/bin/sh

WORK_DIR=$(pwd)
TOOLS_DIR="$WORK_DIR/tools"

cd $TOOLS_DIR
npm install
PATH=$PATH:$TOOLS_DIR/node_modules/.bin
node_modules/.bin/bower install --allow-root --force
npm run build
