#!/bin/sh
set -e

# Remove current node_modules as it may
# contain incompatible native modules
rm -rf node_modules
npm install
npm run build-backend

if [ "${USER_NAME}" -neq "root" ]; then
  adduser -D -G users -u ${USER_ID} ${USER_NAME}
  chown -R ${USER_NAME}:${GROUP_ID} outputs/
fi

# Clean node_modules
rm -rf node_modules
