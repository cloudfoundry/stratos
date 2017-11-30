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

npm install --production
export PATH=$PATH:$WORK_DIR/node_modules/.bin

# Change the bower file to build with different components, if specified
if [ ! -z "${STRATOS_BOWER}" ]; then
  BOWER_OVERRIDE=./deploy/${STRATOS_BOWER}/bower.json
  if [ -f $BOWER_OVERRIDE ]; then
    rm bower.json
    cp ${BOWER_OVERRIDE} bower.json
    echo "** Changed bower.json - copied from ${BOWER_OVERRIDE}"
  fi
fi

bower install --allow-root --force
npm run build

if [ ! -z "${CREATE_USER}" ]; then
  chown -R ${USER_ID}:${GROUP_ID} node_modules
  chown -R ${USER_ID}:${GROUP_ID} bower_components
  chown -R ${USER_ID}:${GROUP_ID} dist
fi