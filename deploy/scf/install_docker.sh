#!/bin/bash

# This script is based on https://github.com/hpcloud/hcf/blob/develop/container-host-files/opt/hcf/bin/docker/install_docker.sh

set -e


user=${1:-vagrant}

if test $(id -u) -ne '0' ; then
    sudo bash "$0" "$@"
    exit $?
fi

apt-get update
apt-get install apt-transport-https ca-certificates -y
apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D

echo 'deb https://apt.dockerproject.org/repo ubuntu-trusty main' > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install docker-engine=1.12.0-0~trusty lvm2 -y
usermod -aG docker $user

