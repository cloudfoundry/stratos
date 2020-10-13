#!/bin/bash

VERSION=1.6.7

mkdir ./swag_tmp
pushd swag_tmp > /dev/null
wget https://github.com/swaggo/swag/releases/download/v${VERSION}/swag_${VERSION}_Linux_x86_64.tar.gz
tar -xvf swag_${VERSION}_Linux_x86_64.tar.gz
sudo mv swag ~/bin
swag --version

popd > /dev/null
rm -rf ./swag_tmp
echo "Swag installed"
