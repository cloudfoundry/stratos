#!/bin/bash
set -e

rm -rf node_modules
npm install --production
if [ ! -z ${BUILD_DB_MIGRATOR} ]; then
npm run build-migrator;
else
npm run build-backend
fi
if [ "${USER_NAME}" != "root" ]; then
  useradd -G users -u ${USER_ID} ${USER_NAME}
  chown -R ${USER_NAME}:${GROUP_ID} outputs/
fi

# Clean node_modules
rm -rf node_modules
