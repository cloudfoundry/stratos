#!/usr/bin/env bash

set -e

# Configure UAA
docker build . -f Dockerfile.uaa -t config-uaa
docker run -it --rm --network=shared_nw config-uaa

# Configure CF
docker build . -f Dockerfile.cf -t config-cf
docker run -it --rm --network=shared_nw config-cf
