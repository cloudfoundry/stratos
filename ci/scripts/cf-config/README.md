## Prerequisites
Create the network `shared_nw` the bridges Docker with the Vagrant VM that is running SCF.
 
1. Determine which interface has the IP `192.168.77.1`.  In the following its `virbr2`
```
$ /sbin/ifconfig | grep -b2 192.168.77.1
4273-virbr2    Link encap:Ethernet  HWaddr 52:54:00:D3:AB:D3  
4331:          inet addr:192.168.77.1  Bcast:192.168.77.255  Mask:255.255.255.0
4406-          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1

```

2. Create a docker network bridge to `virbr2`
```
$ sudo docker network create \
    --driver bridge \
    --subnet=192.168.77.0/24 \
    --gateway=192.168.77.1 \
    --opt "com.docker.network.bridge.name"="virbr2" \
    shared_nw
```

To confirm if the bridge was created
```
09:36 $ docker network ls
NETWORK ID          NAME                    DRIVER              SCOPE
d44534fe24c8        bridge                  bridge              local
28ecb8cb08ca        host                    host                local
240f36c2a890        none                    null                local
f7d42c5dfe69        shared_nw               bridge              local
140a521a7131        stratosdeploy_default   bridge              local
c0f818b0a87d        workspace_default       bridge              local
```

## Run Script

To run the script execute the following
```
$ ./configure-scf.sh
```

The script will prompt for user input when it is updating the `admin` password to SCF. This needs to be set to `hscadmin`.
