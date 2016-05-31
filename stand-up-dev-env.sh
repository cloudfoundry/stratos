#!/bin/bash
cd $GOPATH/src/github.com/hpcloud/portal-proxy/tools/
./build_portal_proxy.sh
cd -
docker-compose -f docker-compose.development.yml build && docker-compose -f docker-compose.development.yml up -d
docker ps
echo "Done!"
