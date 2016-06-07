#!/bin/bash
cd ../..
git clone https://github.com/hpcloud/helion-ui-theme.git
git clone https://github.com/hpcloud/helion-ui-framework.git
git clone https://github.com/hpcloud/stratos-identity-db.git
git clone https://github.com/hpcloud/stratos-node-server.git
git clone https://github.com/hpcloud/stratos-server.git
git clone https://github.com/hpcloud/stratos-ui.git

export GOPATH=$(pwd)
mkdir -p src/github.com/hpcloud
cd src/github.com/hpcloud
git clone https://github.com/hpcloud/portal-proxy.git
