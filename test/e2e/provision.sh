#!/bin/sh

# TODO: combine with the stratos-ui/provision.sh, the only difference is the conditional
WORK_DIR=$(pwd)
cp -r /node_modules .
if [ "$(md5sum /package.json | cut -d' ' -f1)" != "$(md5sum package.json| cut -d' ' -f1)" ]; then
  echo -e "\033[31mpackage.json was updated, please update the hsc-concourse:latest image. Running npm install\033[0m"
  npm install
else
  echo -e "\033[32mpackage.json has not changed. Skipping npm install\033[0m"
fi
PATH=$PATH:${WORK_DIR}/node_modules/.bin
ls build
bower install --allow-root --force
npm run build
