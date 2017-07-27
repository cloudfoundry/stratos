#!/bin/sh
set -e

rm -rf node_modules
npm install
npm run build-backend

if [ "${USER_NAME}" != "root" ]; then
  adduser -D -G users -u ${USER_ID} ${USER_NAME}
  chown -R ${USER_NAME}:${GROUP_ID} outputs/
fi

# Clean node_modules
rm -rf node_modules
