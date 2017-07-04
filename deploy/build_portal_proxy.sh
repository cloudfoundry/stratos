#!/bin/bash

# NOTE: You can execute commands on the docker-container by passing "CMD" arguments into this
#       helper script.  For example: "build_portal_proxy.sh bash"

set -x

pushd $(git rev-parse --show-toplevel)

docker run -it \
           --rm \
           -e USER_NAME=$(id -nu) \
           -e USER_ID=$(id -u)  \
           -e GROUP_ID=$(id -g) \
           --name console-proxy-builder \
           --volume $(pwd):/go/src/github.com/SUSE/stratos-ui \
           splatform/stratos-proxy-builder:test $*

ret=$?
popd
exit ${ret}
