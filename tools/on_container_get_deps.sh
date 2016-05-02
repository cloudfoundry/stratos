#!/bin/sh

# This script is intended to be run on a container.
# Don't run this locally.

# This file is present to provide a bit of extraction to the dependency gathering process.
# It's possible that we'll go with go dep, or glide, or just leave it as is.

go get -d -v
