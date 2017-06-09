# Deploy Console in Kubernetes using Minikube and Helm

## Setup Minkube

**minimum supported version - 0.18.0**

Minikube requires either Virtual Box or KVM installations. **There is a issue when using Virtual Box 5.1.18 which 
results in Minikube failing to create the host-only network. The process in this guide uses Virtual Box 5.1.16**

Minikube will bring up a VM which utilises the first namespace described in the host's resolv.config. **If you have 
updated this from the default please ensure that the namespace can reach all required external and internal locations.**

Follow instructions specified in https://github.com/kubernetes/minikube
At the bare minimum you need to do the following
- Install `kubectl`, follow the instructions specified in https://kubernetes.io/docs/tasks/kubectl/install/
- Download MiniKube and start the instance with:
 ```
minikube start
```

## Setup Helm
- Download the Helm binary for your system from https://github.com/kubernetes/helm/releases.
For convenience the guide assumes that helm binary has been added to your PATH.
- To install the Helm server (Tiller) in your Minikube setup, run the following:
```
helm init
```

## Deploy Console
The following will deploy the console using Helm using the default values:
```
$ cd kubernetes
$ helm install console --namespace console --name my-console
```

This will create a Console instance named `my-console` in a namespace called `console` in your local cluster.
To check the status of the instance use the following command:
```
helm status my-console
```

Once the instance is in `DEPLOYED` state, retrieve the Console UI IP address.
```
$ minikube ip
$ 192.168.99.100
```

Also the node-port
```
$ helm status my-console | grep ui-ext
console-ui-ext        10.0.0.162  <nodes>      80:30933/TCP,443:30941/TCP  1m  
```

The node-port is in this example is `30941`, access the console by accessing the following in a browser. You may see a certificate warning which you can safely ignore.
```
https://192.168.99.100:30941
```

To login use the following credentials:
 - username: `admin`,
 TODO Can we change this to changeme?
 - password: `hscadmin`
 
## Build the latest Console
To publish the console to a private repository or a different organisation, use the `build.sh` script.
This script will build the all the components and publish the images to a specified repository or organisation. The script will produce an overrides file which can be used with Helm when create the Console instance.

For instance:
```
./build.sh -o suse -r docker.suse.de -t 1.0.0
```
Will upload the component images to `docker.suse.de/suse` and tag them with `1.0.0-hash`, where hash is the latest commit in the `portal-proxy` branch.

## Troubleshooting
If creating of containers is stalled and no persistent volume claims exist, delete and purge the console and create the following persistent volume.

The following will map a local folder to be used as a persistent volume for kubernetes.
```
cd kubernetes
kubectl create -f optional/console-pv.yaml
```
