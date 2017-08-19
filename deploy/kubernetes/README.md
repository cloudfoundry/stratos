# Deploying in Kubernetes

The following guide details how to deploy the Stratos UI Console in Kubernetes.

## Requirements:

### Kubernetes

You will need a suitable Kubernetes environment and a machine from which to run the deployment commands.

You will need to have the `kubectl` CLI installed and available on your path. It should be appropriately configured to be able to communicate with your Kubernetes environment.

### Setup Helm

We use [Helm](https://github.com/kubernetes/helm) for deploying to Kubernetes.

You will need the Helm client installed on the machine from which you are deploying and you will need to install the Helm Server (Tiller) into you Kubernetes environment.

- Download the Helm client for your system from https://github.com/kubernetes/helm/releases.
For convenience the guide assumes that the helm client has been added to your PATH.
- To install the Helm server (Tiller) in your Kubernetes environment by running the following command:
```
helm init
```
## Deploy using the Helm repository

Add the Helm repository to your helm installation
```
helm repo add stratos-ui https://suse.github.io/stratos-ui
```
Check the repository was successfully added by searching for the `console`
```
helm search console 
NAME                    VERSION DESCRIPTION                       
stratos-ui/console      0.9.0 A Helm chart for deploying Console
```
To install the Console
```
helm install stratos-ui/console --namespace=console --name my-console
```

> You can change the namespace (--namespace) and the release name (--name) to values of your choice.

This will create a Console instance named `my-console` in a namespace called `console` in your Kubernetes cluster. If you are deploying into a cluster that is not configured with a dynamic storage provisioner like `glusterfs` or `ceph`. You should specify the `noShared` override when installing the chart. 

```
helm install --set noShared=true stratos-ui/console --namespace=console --name my-console
```

After the install, you should be able to access the Console in a web browser by following [the instructions](#accessing-the-console) below.

#### Upgrading your deployment

To upgrade your instance when using the Helm repository, fetch any updates to the repository:

```
$ helm repo update
```

To update an instance, the following assumes your instance is called `my-console`, and overrides have been specified in a file called `overrides.yaml`.

```
$ helm upgrade -f overrides.yaml my-console stratos-ui/console --recreate-pods
```

After the upgrade, perform a `helm list` to ensure your console is the latest version.


## Deploying using the GitHub repository

To deploy the Stratos UI Console:

Open a terminal and cd to the `deploy/kubernetes` directory:

```
$ cd deploy/kubernetes
```

Run helm install:

```
$ helm install console --namespace console --name my-console
```

> You can change the namespace (--namespace) and the release name (--name) to values of your choice.

This will create a Console instance named `my-console` in a namespace called `console` in your Kubernetes cluster.

You should now be able to access the Console in a web browser by following the instructions below.

## Accessing the Console

To check the status of the instance use the following command:
```
helm status my-console
```

> Note: Replace `my-console` with the value you used for the `name` parameter, or if you did not provide one, use the `helm list` command to find the release name that was automatically generated for you.

Once the instance is in `DEPLOYED` state, find the IP address and port that the console is running on:

```
$ helm status my-console | grep ui-ext
console-ui-ext        10.0.0.162  192.168.77.1      80:30933/TCP,443:30941/TCP  1m  
```

In this example, the IP address is `192.168.77.1` and the node-port is `30941`, so the console is accessible on:

`https://192.168.77.1:30941`

The values will be different for your environment.

You can now access the console UI.

> You may see a certificate warning which you can safely ignore.

To login use the following credentials detailed [here](../../docs/access.md).

> Note: For some environments like Minikube, you are not given an IP Address - it may show as `<nodes>`. In this case, run `kubectl cluster-info` and use the IP address of your node shown in the output of this command.

## UAA for Testing
A UAA Helm chart has been provided to quickly bring up an UAA instance for testing the console.

To setup the UAA, install it via Helm
```
$ cd test
$  helm install uaa --namespace uaa --name my-uaa
```

After setup, the UAA should be available on the service port mapped to the external IP. In the following example it would be `192.168.77.1:31249`.

```
15:26 $ helm status my-uaa
LAST DEPLOYED: Thu Jul  6 14:47:10 2017
NAMESPACE: uaa
STATUS: DEPLOYED

RESOURCES:
==> v1/Service
NAME             CLUSTER-IP  EXTERNAL-IP  PORT(S)         AGE
console-uaa-int  10.0.0.82   192.168.77.1      8080:31249/TCP  40m

==> v1beta1/Deployment
NAME  DESIRED  CURRENT  UP-TO-DATE  AVAILABLE  AGE
uaa   1        1        1           1          4m

```

## Persistent Volumes stuck in `Pending` state when deploying through Helm

The issue may be that your Kubernetes does not have a `default` storage class. You can list your configured storage classes with `kubectl`. If no storage class has `(default)` after it, then you need to either specify a storage class override or declare a default storage class for your Kubernetes cluster.

#### Provide Storage Class override
```
kubectl get storageclas
$ kubectl get storageclass
NAME                TYPE
ssd                 kubernetes.io/host-path   
persistent          kubernetes.io/host-path   
```

For instance to use the storage class `persistent` to deploy Console persistent volume claims, store the following to a file called `override.yaml`.

```
---
storageClass: persistent
```

Run Helm with the override:
```
helm install -f override.yaml stratos-ui/console
```
#### Create default Storage Class
Alternatively, you can configure a storage class with `storageclass.kubernetes.io/is-default-class` set to `true`. For instance the following storage class will be declared as the default. If you don't have the `hostpath` provisioner available in your local cluster, please follow the instructions on [link] (https://github.com/kubernetes-incubator/external-storage/tree/master/docs/demo/hostpath-provisioner), to deploy one.

If the hostpath provisioner is available, save the file to `storageclass.yaml`

```
---
kind: StorageClass
apiVersion: storage.k8s.io/v1beta1
metadata:
  name: default
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: kubernetes.io/host-path # Or whatever the local hostpath provisioner is called
```

To create it in your kubernetes cluster, execute the following.
```
kubectl create -f storageclass.yaml
```

See [Storage Class documentation] ( https://kubernetes.io/docs/tasks/administer-cluster/change-default-storage-class/) for more insformation.
