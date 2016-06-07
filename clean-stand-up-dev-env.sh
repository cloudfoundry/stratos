#!/bin/bash

echo "===== Cleaning up cached intermediate items"

echo "----- helion-ui-framework"
cd ../helion-ui-framework
rm -rf dist/
rm -rf lib/
rm -rf node_modules/
rm -rf bower_components/
cd -

echo "----- helion-ui-theme"
cd ../helion-ui-theme
rm -rf dist/
cd -

echo "----- stratos-ui"
cd ../stratos-ui
rm -rf dist/
rm -rf npm_modules
rm -rf src/lib/
cd -

echo "===== Building the portal proxy"
cd $GOPATH/src/github.com/hpcloud/portal-proxy/tools/
./build_portal_proxy.sh
cd -

echo "===== Standing up the Helion Stackato Console"
docker-compose -f docker-compose.development.yml build && docker-compose -f docker-compose.development.yml up -d
docker ps

echo "===== Done!"
