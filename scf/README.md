# Deploy SCF in Kubernetes

### Checkout 
1. Make sure you have the following dependencies:
    - KVM
    - Libvirt
    - Vagrant 1.9.3 (Don't use 1.9.4)
    - vagrant-libvirt plugin
    - At least 75GB disk space required, specifically for images in /var/lib/libvirt/

To install the vagrant plugin, do the following:
```
$ sudo zypper in libvirt libvirt-devel ruby-devel gcc qemu-kvm
$ vagrant plugin install vagrant-libvirt
```
    
2. Start the VM

From the scf folder, start the VM with the command:
```
$ vagrant up --provider=libvirt
```

This will initialise all necessary components for `SCF`.  Please leave some time for the images to be pulled down and the containers to initialise.

**Note** - If you run into a `requested nfs version is not supported` exception then edit `/etc/exports` and clear out all entries added by Vagrant, and restart the `nfs-server.service`.

Check for the status of the components by watching the pods:

```
$  vagrant ssh
$  watch -n1 kubectl get po --all-namespaces
```

3. In case some pods appears to be stuck in the not-ready state, for more than 10 minutes, execute the following script:
 
 ```
 $ scf/reset-scf.sh
 ```


### Accessing Kubernetes Dashboard

1. Get the Cluster IP address of the service
```
$ kubectl get service kubernetes-dashboard --namespace=kube-system
NAME                   CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
kubernetes-dashboard   10.0.0.95    <none>        80/TCP    22m

```
2. Tunnel the port by executing the following in the vagrant machine

```
$  ssh  vagrant@localhost -L 192.168.77.77:9090:10.0.0.95:80 -Nf 
```

The kubernetes dashboard will be available at http://cf-dev.io:9090

### Configure CF Cli

1. Download CLI from https://github.com/cloudfoundry/cli#downloads and install it on your host.

2. From your local host, login as follows:
```
$ cf api https://api.cf-dev.io
cf api --skip-ssl-validation https://api.cf-dev.io                                                                                                                                                        
Setting api endpoint to https://api.cf-dev.io...                                                                                                                                                                  
OK                                                                                                                                                                                                                
                                                                                                                                                                                                                  
API endpoint:   https://api.cf-dev.io                                                                                                                                                                             
API version:    2.69.0    
```

```
 cf login
   API endpoint: https://api.cf-dev.io                                                                                                                                                                               
                                                                                                                                                                                                                     
   Email> admin                                                                                                                                                                                                      
   
   Password> changeme
   Authenticating...
   OK
   
   
                   
   API endpoint:   https://api.cf-dev.io (API version: 2.69.0)
   User:           admin
   No org or space targeted, use 'cf target -o ORG -s SPACE'

```
### Creating a network bridge
 
To connect to the CF instance from your docker-compose deployment of console, do the following:
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
3. Add the following to the end of the docker-compose file (`docker-compose.no-ui.development.yml` in case you are deploying without the UI).
```
$ cat <<EOT >> docker-compose.no-ui.development.yml
networks:
  default:
    external:
      name: shared_nw
EOT

```
