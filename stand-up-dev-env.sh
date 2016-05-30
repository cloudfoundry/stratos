#!/bin/bash
$GOPATH/src/github.com/hpcloud/portal-proxy/tools/build_portal_proxy.sh && docker-compose -f docker-compose.development.yml build && docker-compose -f docker-compose.development.yml up -d
echo "Done!"
