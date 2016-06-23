#!/bin/bash

# NOTE: You can execute commands on the docker-container by passing "CMD" arguments into this
#       helper script.  For example: "build_portal_proxy.sh bash"

set -e
set -x

pushd $(git rev-parse --show-toplevel)

# If/when we ever stop vendoring our packages, we'll need to run glide install here.
#glide install

docker build --tag portal-proxy-builder \
             --file Dockerfile.build \
             --build-arg http_proxy=${http_proxy} \
             --build-arg https_proxy=${https_proxy} \
             --build-arg no_proxy=${no_proxy} \
             .

docker run -it \
           --rm \
           --name portal-proxy-builder \
           --volume $(pwd):/go/src/github.com/hpcloud/portal-proxy \
           portal-proxy-builder $*

popd
