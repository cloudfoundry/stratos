#!/bin/bash

echo "==========================================="
echo "Generate Go Modules Vendor Cache for Travis"
echo "==========================================="

# Install go
apt-get update
apt-get install -y curl
apt-get install -y git
curl -sL -o ./gimme https://raw.githubusercontent.com/travis-ci/gimme/master/gimme
chmod +x ./gimme
eval "$(./gimme 1.13.4)"
mkdir -p /root/go/bin
export PATH=/root/go/bin:$PATH
cd /stratos/src/jetstream
go mod vendor

SUM=$(cat go.mod go.sum | md5sum | awk '{ print $1 }')
tar -czf go-vendor-${SUM}.tgz ./vendor
mv go-vendor-${SUM}.tgz ../..
echo $SUM
echo "Completed"

