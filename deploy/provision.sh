#!/bin/bash

WORK_DIR=$(pwd)

if [ ! -z "${CREATE_USER}" ]; then
  # If running in a container create the required user
  # and group when writing to the volume
  user_exists=$(getent passwd ${USER_ID} | cut -d: -f1);
  group_exists=$(getent group ${GROUP_ID} | cut -d: -f1);
  if [ -z "${group_exists}" ]; then
      groupadd -r -g ${GROUP_ID} ${USER_NAME};
      fi ;
  if [ -z "${user_exists}" ]; then
        useradd -m -r -g ${GROUP_ID} -u ${USER_ID} ${USER_NAME};
  fi
fi

npm install
export PATH=$PATH:$WORK_DIR/node_modules/.bin

npm run build

if [ ! -z "${CREATE_USER}" ]; then
  chown -R ${USER_ID}:${GROUP_ID} node_modules
  chown -R ${USER_ID}:${GROUP_ID} dist
fi

# Copy dist folder to the /usr/dist folder when running in docker compose
if [ "$1" == "-u" ]; then
  rm -rf /usr/dist/*
  cp -R dist/* /usr/dist
fi