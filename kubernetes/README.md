# Deploy Console in Kubernetes using Minikube and Helm

## Pre-requisites
This guide assumes that you have checked out the following repositories and places them at the same level as this project.
- stratos-ui https://github.com/hpcloud/stratos-ui
- portal-proxy https://github.com/hpcloud/portal-proxy

## Setup Minkube
Follow instructions specified in https://github.com/kubernetes/minikube
At the bare minimum you need to do the following
- Install `kubectl`, follow the instructions specified in https://kubernetes.io/docs/tasks/kubectl/install/
- Download MiniKube and start the instance with:
 ```
minikube start
```

## Declare a persistent volume

By default minkube does not have a persistent volume against which volumes for the containers can be created.
The following will map a local folder to be used as a persistent volume for kubernetes.
```
kubectl create -f optional/console-pv.yaml
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
helm install console --namespace console --name my-console
```

This will create a Console instance named `my-console` in a namespace called `console` in your local cluster.
To check the status of the instance use the following command:
```
helm status my-console
```

Once the instance is in `DEPLOYED` state, retrieve the Console UI node-port.
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
 - password: `hscadmin`
 
## Build you own Console
To publish the console to a private repository or a different organisation, use the `build.sh` script.
This script will build the all the components and publish the images to a specified repository or organisation. The script will produce an overrides file which can be used with Helm when create the Console instance.

For instance:
```
./build.sh -o suse -r docker.suse.de -t 1.0.0
```
Will upload the component images to `docker.suse.de/suse` and tag them with `1.0.0-hash`, where hash is the latest commit in the `portal-proxy` branch.
