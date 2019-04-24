#!/bin/bash

echo "== Sync Monocular backend code =="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo ${DIRPATH}

pushd ${DIRPATH} >& /dev/null
rm -rf tmp
mkdir tmp
git clone https://github.com/helm/monocular.git ./tmp/monocular

# Copy the golang backend code
cp -R ./tmp/monocular/cmd/* .

# Add to the chartsvc API
cat ./chartsvc_main.txt >> ./chartsvc/main.go

# Update packages
sed -i.bak -e 's/package main/package chartsvc/g' ./chartsvc/*.go
sed -i.bak -e 's/package main/package chartrepo/g' ./chart-repo/*.go

# Remove .bak files
find . -name "*.bak" -type f -delete

# Remove tmp folder
rm -rf ./tmp

# Initialize go modules
cd ./chartsvc
go mod init github.com/helm/monocular/chartsvc

cd ../chart-repo
go mod init github.com/helm/monocular/chartrepo

popd >& /dev/null

echo "All done"
