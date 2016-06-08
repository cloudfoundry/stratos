# DOCKER-MACHINE Creation

Since many of us are using macs, we don't have docker running locally.
Now with the change to start using UCP (HCP?) (PCP?) we will need to have VMWare
Fusion running because apparently, ?CP won't run on vBox. This means that it
would make a LOT more sense to run your docker-machine on VMWare instead of vBox.

In order to facilitate this, please run:

## Setup / Requirements:
  - vmrun is in your path
    - Likely: /Applications/VMware Fusion.app/Contents/Library
  - docker-machine-nfs is installed
    - https://github.com/adlogix/docker-machine-nfs
    - brew install docker-machine-nfs

NOTE: Here's a few sites that gives lots of good info on running vmrun commands:
  - https://blog.aitrus.com/2012/12/14/os-x-fusion-command-line-vms-as-daemons/
  - http://www.vmware.com/pdf/vix180_vmrun_command.pdf

## Running the script:

```
tools/create-vmware-docker-machine <machine-name>
# <machine-name> defaults to "default"
```
