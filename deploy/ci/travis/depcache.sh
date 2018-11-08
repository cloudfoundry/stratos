#!/bin/bash

echo "============================="
echo "Generate Dep Cache for Travis"
echo "============================="

# Install go and dep
apt-get update
apt-get install -y curl
apt-get install -y git
curl -sL -o ./gimme https://raw.githubusercontent.com/travis-ci/gimme/master/gimme
chmod +x ./gimme
eval "$(./gimme 1.9.7)"
mkdir -p /root/go/bin
curl https://raw.githubusercontent.com/golang/dep/master/install.sh | sh
export PATH=/root/go/bin:$PATH
export DEPPROJECTROOT=./stratos
cd /stratos
dep ensure -v --vendor-only

SUM=$(cat Gopkg.toml Gopkg.lock | md5sum | awk '{ print $1 }')
tar -czf travis-vendor-${SUM}.tgz ./vendor
echo $SUM
echo "Completed"

