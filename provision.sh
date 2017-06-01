#!/bin/sh

WORK_DIR=$(pwd)

npm run clean
npm install
PATH=$PATH:$WORK_DIR/node_modules/.bin
bower install --allow-root --force
npm run build
