#!/bin/bash
# This script is based on https://github.com/hpcloud/hcf/blob/develop/container-host-files/opt/hcf/bin/docker/setup_network.sh

set -e

# Usage: setup_overlay_network.sh <OVERLAY_SUBNET> <OVERLAY_GATEWAY>
overlay_subnet=$1
overlay_gateway=$2

docker network create --driver=bridge --subnet="${overlay_subnet}" --gateway="${overlay_gateway}" hcf
