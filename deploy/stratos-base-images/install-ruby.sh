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
  zypper in -y ruby-devel
fi

# OpenSUSE Leap 15.1 will install ruby 2.5
zypper in -y ruby

ruby --version
