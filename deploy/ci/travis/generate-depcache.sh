#!/bin/bash

# Create a vendor cache package for use in Travis

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

echo $DIRPATH
docker run -v ${DIRPATH}:/stratos ubuntu:trusty /stratos/deploy/ci/travis/depcache.sh