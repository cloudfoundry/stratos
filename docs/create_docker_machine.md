# DOCKER-MACHINE Creation

Since many of us are using macs, we don't have docker running locally.
Now with the change to start using UCP (HCP?) (PCP?) we will need to have VMWare
Fusion running because apparently, ?CP won't run on vBox. This means that it
would make a LOT more sense to run your docker-machine on VMWare instead of vBox.

In order to facilitate this, please run:

```
tools/create-vmware-docker-machine <machine-name>
```

<machine-name> defaults to "default"
