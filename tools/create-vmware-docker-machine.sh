#!/usr/bin/env bash
set -eu

# USAGE:  docker-machine-create <machine-name>
#   machine-name defaults to "default"

# Setup / Requirements:
#  - vmrun is in your path
#    - Likely: /Applications/VMware Fusion.app/Contents/Library
#  - docker-machine-nfs is installed
#    - https://github.com/adlogix/docker-machine-nfs
#    - brew install docker-machine-nfs

# NOTE: Here's a site that gives lots of good info on running vmrun commands:
#       https://blog.aitrus.com/2012/12/14/os-x-fusion-command-line-vms-as-daemons/


# First, let's verify some paths:
hash vmrun 2>/dev/null || { echo >&2 "vmrun is not in your path.  Check /Applications/VMware Fusion.app/Contents/Library" ; exit 1; }

hash docker-machine-nfs 2>/dev/null || { echo >&2 "docker-machine-nfs is not installed.  Check https://github.com/adlogix/docker-machine-nfs" ; exit 1; }


# Take in the machine name.  "default" is the default.
dockerMachineName=${1:-default}

# Create the docker-machine using the vmwarefusion drivers.
docker-machine create \
               --vmwarefusion-cpu-count=2 \
	       --vmwarefusion-disk-size=40000 \
	       --vmwarefusion-memory-size=2048 \
	       --driver vmwarefusion \
	       "$dockerMachineName"

# We need to alter the machine's settings in a few ways before we can really
# use it in a dev env.  To do this, we'll need the new machine's path.
vmMachinePath=$(vmrun list | grep $dockerMachineName)

# We're going to disable vmWare sharing, ...
vmrun disableSharedFolders "$vmMachinePath"

# ... because we're going to use NFS sharing instead.
docker-machine-nfs "$dockerMachineName"

# Luckily enough, docker-machine-nfs restarts the machine for us!
