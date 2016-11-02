#!/bin/sh

WORK_DIR=$(pwd)
TOOLS_DIR="$WORK_DIR/tools"
cd ${TOOLS_DIR}
cp -r /node_modules .
if [ "$(md5sum /package.json | cut -d' ' -f1)" != "$(md5sum package.json| cut -d' ' -f1)" ]; then
  echo -e "\033[31mpackage.json was updated, please update the image. Running npm install\033[0m"
  npm install
else
  echo -e "\033[32mpackage.json has not changed. Skipping npm install\033[0m"
fi
PATH=$PATH:$TOOLS_DIR/node_modules/.bin
bower install --allow-root --force
npm run build
