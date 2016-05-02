#!/bin/bash

# NOTE: You can execute commands on the docker-container by passing "CMD" arguments into this
#       helper script.  For example: "build_portal_proxy.sh bash"

set -x

docker build --tag portal-proxy-builder \
             --file tools/build.Dockerfile \
             .

docker run -it \
           --rm \
           --name portal-proxy-builder \
           --volume /Users/mwood/Code/stratos/portal-proxy:/go/src/portal-proxy \
           portal-proxy-builder $*
