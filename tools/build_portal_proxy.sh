#!/bin/bash

# NOTE: You can execute commands on the docker-container by passing "CMD" arguments into this
#       helper script.  For example: "build_portal_proxy.sh bash"

set -ex

pushd $(git rev-parse --show-toplevel)

docker run -it \
           --rm \
           --name console-proxy-builder \
           --volume $(pwd):/go/src/github.com/hpcloud/portal-proxy \
           docker-registry.helion.space:443/hsc/console-proxy-builder $*

popd
