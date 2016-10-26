#!/bin/bash

# NOTE: You can execute commands on the docker-container by passing "CMD" arguments into this
#       helper script.  For example: "build_portal_proxy.sh bash"

set -x

pushd $(git rev-parse --show-toplevel)

docker run -it \
           --rm \
           --name hsc-console-proxy-builder \
           --volume $(pwd):/go/src/github.com/hpcloud/portal-proxy \
           docker.io/stackatodev/hsc-console-proxy-builder $*

ret=$?
popd
exit ${ret}
