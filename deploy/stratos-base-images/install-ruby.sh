#!/bin/bash

SLES=$(cat /etc/os-release | grep "SLES" -c)
IS_SLES="false"
if [ $SLES -eq 1 ]; then
  IS_SLES="true"
fi

cat /etc/os-release
echo ""
echo "SLES? : ${IS_SLES}"

# Fail if anything fails to install
set -e

if [ "$IS_SLES" == "false" ]; then
  zypper in -y curl jq make gcc-c++
  zypper in -y libopenssl-devel readline-devel  
fi

# Build from source
mkdir -p /tmp/ruby
cd /tmp/ruby
wget https://cache.ruby-lang.org/pub/ruby/2.3/ruby-2.3.8.tar.gz
gunzip ./ruby-2.3.8.tar.gz
tar -xvf ./ruby-2.3.8.tar
cd ruby-2.3.8

./configure

make
make install

# else
#   zypper in -y ruby2.3 ruby2.3-devel gcc-c++ jq curl make
#   cp /usr/bin/ruby.ruby2.3 /usr/bin/ruby
# fi

ruby --version
