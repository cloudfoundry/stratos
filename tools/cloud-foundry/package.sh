#!/bin/bash

set -e

echo "Preparing application folder for Cloud Foundry deployment\n\n"

CF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOP_LEVEL=${CF_DIR}/../../
BOWER_PATH=${NODE_HOME}/bin


# Copy the config file
cp ${CF_DIR}/config.properties ${TOP_LEVEL}

cat << EOF > ${TOP_LEVEL}/plugins.json
{
 "enabledPlugins":[
   "cloud-foundry",
   "cloud-foundry-hosting"
 ]
}
EOF

# Delete endpoints-dashboard from bower.json
sed -i '/"endpoints-dashboard.*/d' bower.json

npm install -g gulp bower

cd ${TOP_LEVEL}

npm install --only=prod
#npm install --only=dev

${BOWER_PATH}/bower install

npm run build
npm run build-backend
npm run build-cf

chmod +x portal-proxy

./portal-proxy

