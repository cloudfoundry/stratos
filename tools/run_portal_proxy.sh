#!/bin/bash

# NOTE: You can execute commands on the docker-container by passing "CMD" arguments into this
#       helper script.  For example: "run_portal_proxy.sh bash"

set -x

docker build --tag portal-proxy-server \
             --file tools/server.Dockerfile \
             .

docker run -it \
           --rm \
           --publish 443:8080 \
           --name portal-proxy-server \
           portal-proxy-server $*

