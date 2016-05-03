#!/bin/bash

# NOTE: You can execute commands on the docker-container by passing "CMD" arguments into this
#       helper script.  For example: "build_portal_proxy.sh bash"

set -x

pushd $(git rev-parse --show-toplevel)

docker build --tag portal-proxy-builder \
             --file build.Dockerfile \
             .

docker run -it \
           --rm \
           --name portal-proxy-builder \
           --volume $(pwd):/go/src/portal-proxy \
           portal-proxy-builder $*

popd
