#!/usr/bin/env bash

# Configure UAA
docker build . -f Dockerfile.uaa -t config-uaa
docker run -i -t --network=shared_nw config-uaa

# Configure CF
docker build . -f Dockerfile.cf -t config-cf
docker run -i -t --network=shared_nw config-cf
