# Deploying in Kubernetes

The following guide details how to deploy Stratos in Kubernetes.

<!-- TOC -->
- [Requirements](#requirements)
  * [Kubernetes](#kubernetes)
  * [Helm](#helm)
  * [Storage Class](#storage-class)
- [Deploying Stratos](#deploying-stratos)
  * [Deploy using the Helm repository](#deploy-using-the-helm-repository)
  * [Deploy using an archive of the Helm Chart](#deploy-using-an-archive-of-the-helm-chart)
  * [Deploying using the GitHub repository](#deploying-using-the-github-repository)
- [Accessing the Console](#accessing-the-console)
- [Advanced Topics](#advanced-topics)
  * [Using a Load Balancer](#using-a-load-balancer)
  * [Using an Ingress Controller](#ingress)
  * [Specifying an External IP](#specifying-an-external-ip)
  * [Upgrading your deployment](#upgrading-your-deployment)
  * [Specifying UAA configuration](#specifying-uaa-configuration)
  * [Configuring a local user account](#configuring-a-local-user-account)
  * [Specifying a custom Storage Class](#specifying-a-custom-storage-class)
    + [Providing Storage Class override](#providing-storage-class-override)
    + [Create a default Storage Class](#create-a-default-storage-class)
  * [Deploying Stratos with your own TLS certificates](#deploying-stratos-with-your-own-tls-certificates)
  * [Using with a Secure Image Repostiory](#using-with-a-secure-image-repository)
  * [Installing Nightly Release](#installing-a-nightly-release)
<!-- /TOC -->

## Requirements

### Kubernetes

You will need a suitable Kubernetes environment and a machine from which to run the deployment commands.

You will need to have the `kubectl` CLI installed and available on your path. It should be appropriately configured to be able to communicate with your Kubernetes environment.

### Helm

We use [Helm](https://github.com/kubernetes/helm) for deploying to Kubernetes.

You will need the latest Helm client installed on the machine from which you are deploying and you will need to install the Helm Server (Tiller) into you Kubernetes environment.

- Download the Helm client for your system from https://github.com/kubernetes/helm/releases.
For convenience the guide assumes that the helm client has been added to your PATH.
- To install the Helm server (Tiller) in your Kubernetes environment by running the following command:
```
helm init
```

If you already Helm installed, please make sure it is the latest version. To update your Helm server (Tiller) in your Kubernetes environment after you download the latest Helm release, run the following command:
```
helm init --upgrade
```
### Storage Class

Stratos uses persistent volumes. In order to deploy it in your Kubernetes environment, you must
have a storage class available.

Without configuration, the Stratos Helm Chart will use the default storage class. If a default storage
class is not available, installation will fail.

To check if a `default` storage class exists, you can list your configured storage classes with `kubectl get storageclass`. If no storage class has `(default)` after it, then you need to either specify a storage class override or declare a default storage class for your Kubernetes cluster.

For non-production environments, you may want to use the `hostpath` storage class. See the [SCF instructions](https://github.com/SUSE/scf/wiki/How-to-Install-SCF#choosing-a-storage-class) for details on setting this up. Note that you will need to make this storage class the default storage class, e.g.

```
kubectl patch storageclass <your-class-name> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```
Where `<your-class-name>` would be `hostpath` if you follow the SCF instructions.
## Deploying Stratos

You can deploy Stratos from one of three different sources:

1. Using our Helm repository
1. Using an archive file containing a given release of our Helm chart
1. Using the latest Helm chart directly from out GitHub repository

> **Note**: By default each deployment method deploys Stratos with its default user authentication mechanism - which requires a UAA. If you wish to use Stratos without the requirement for a UAA component, use the deployment commands from the following section below: [Configuring a local user account](#configuring-a-local-user-account). All other steps for each deployment method remain the same, as detailed in the following sections.

### Deploy using the Helm repository

Add the Helm repository to your helm installation
```
helm repo add stratos https://cloudfoundry.github.io/stratos
```
Check the repository was successfully added by searching for the `console`
```
helm search console 
NAME                    VERSION DESCRIPTION                       
stratos/console         0.9.0 A Helm chart for deploying Console
```
To install Stratos.

```
helm install stratos/console --namespace=console --name my-console
```
> **Note**: The previous assumes that a storage class exists in the kubernetes cluster that has been marked as `default`. If no such storage class exists, a specific storage class needs to be specified, please see the following section *Specifying a custom Storage Class*. 

> You can change the namespace (--namespace) and the release name (--name) to values of your choice.

This will create a Console instance named `my-console` in a namespace called `console` in your Kubernetes cluster.

After the install, you should be able to access the Console in a web browser by following [the instructions](#accessing-the-console) below.

### Deploy using an archive of the Helm Chart

Helm chart archives are available for Stratos releases from our GitHub repository, under releases - see https://github.com/suse/stratos/releases.

Download the appropriate release `console-helm-chart.X.Y.Z.tgz` from the GitHub repository and unpack the archive to a local folder. The Helm Chart will be extracted to a sub-folder named `console`.

Deploy Stratos with:

```
helm install console --namespace=console --name my-console
```

### Deploying using the GitHub repository

> Note: Deploying using the GitHub repository uses the latest Stratos images that are built nightly (tagged `latest`). While these contain the very latest updates, they may contain bugs or instabilities.

Clone the Stratos GitHub repository:

```
git clone https://github.com/suse/stratos.git
```

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

You can now access the UI.

> You may see a certificate warning which you can safely ignore.

To login use the following credentials detailed [here](../../docs/access.md).

> Note: For some environments like Minikube, you are not given an IP Address - it may show as `<nodes>`. In this case, run `kubectl cluster-info` and use the IP address of your node shown in the output of this command.

## Advanced Topics
### Using a Load Balancer
If your Kubernetes deployment supports automatic configuration of a load balancer (e.g. Google Container Engine), specify the parameters `console.service.type=LoadBalancer` when installing.

```
helm install stratos/console --namespace=console --name my-console --set console.service.type=LoadBalancer
```

### Using an Ingress Controller

If your Kubernetes Cluster supports Ingress, you can expose Stratos through Ingress by supplying the appropriate ingress configuration when installing.

This configuration is described below:

|Parameter|Description|Default|
|----|---|---|
|console.service.ingress.enabled|Enables ingress|false|
|console.service.ingress.annotations|Annotations to be added to the ingress resource.|{}|
|console.service.ingress.extraLabels|Additional labels to be added to the ingress resource.|{}|
|console.service.ingress.host|The host name that will be used for the Stratos service.||
|console.service.ingress.secretName|The existing TLS secret that contains the certificate for ingress.||

You must provide `console.service.ingress.host` when enabling ingress.

By default a certificate will be generated for TLS. You can provide your own certificate by creating a secret and specifying this with `console.service.ingress.secretName`.

> Note: If you do not supply `console.service.ingress.host` but do supply `env.DOMAIN` then the host `console.[env.DOMAIN]` will be used.

### Specifying an External IP

If the kubernetes cluster supports external IPs for services (see [ Service External IPs](https://kubernetes.io/docs/concepts/services-networking/service/#external-ips)), then the following arguments can be provided. In this following example the dashboard will be available at `https://192.168.100.100:5000`.

```
helm install stratos/console --namespace=console --name my-console --set console.service.externalIPs={192.168.100.100} --set console.service.servicePort=5000
```

### Upgrading your deployment

To upgrade your instance when using the Helm repository, fetch any updates to the repository:

```
$ helm repo update
```

To update an instance, the following assumes your instance is called `my-console`, and overrides have been specified in a file called `overrides.yaml`.

```
$ helm upgrade -f overrides.yaml my-console stratos/console
```

After the upgrade, perform a `helm list` to ensure your console is the latest version.



### Specifying UAA configuration

When deploying with SCF, the `scf-config-values.yaml` (see [SCF Wiki link](https://github.com/SUSE/scf/wiki/How-to-Install-SCF#configuring-the-deployment)) can be supplied when installing Stratos.
```
$ helm install stratos/console  -f scf-config-values.yaml
```

Alternatively, you can supply the following configuration. Edit according to your environment and save to a file called `uaa-config.yaml`.
```
uaa:
  protocol: https://
  port: 2793
  host: uaa.cf-dev.io
  consoleClient:  cf
  consoleClientSecret: 
  consoleAdminIdentifier: cloud_controller.admin 
  skipSSLValidation: false
```

To install Stratos with the above specified configuration:
```
$ helm install stratos/console -f uaa-config.yaml
```

### Configuring a local user account

This allows for deployment without a UAA. To enable the local user account, supply a password for the local user in the deployment command, as follows. All other steps for each deployment method should be followed as in the preceding sections above.

To deploy using our Helm repository:

```
helm install stratos/console --namespace=console --name my-console --set console.localAdminPassword=<password>
```

To deploy using an archive file containing a given release of our Helm chart

```
helm install console --namespace=console --name my-console --set console.localAdminPassword=<password>
```

To deploy using the latest Helm chart directly from out GitHub repository

```
$ helm install console --namespace console --name my-console --set console.localAdminPassword=<password>
```

For console access via the local user account see: [*Accessing the Console*](#accessing-the-console)

### Specifying a custom Storage Class 

If no default storage class has been defined in the Kubernetes cluster. The Stratos helm chart will fail to deploy successfully. To check if a `default` storage class exists, you can list your configured storage classes with `kubectl`. If no storage class has `(default)` after it, then you need to either specify a storage class override or declare a default storage class for your Kubernetes cluster.

#### Providing Storage Class override
```
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

If you want MariaDB to use a specific storage class (which can be different to that used for the other components), then specify the following:
```
---
storageClass: persistent
mariadb:
  persistence:
    storageClass: persistent
```

Run Helm with the override:
```
helm install -f override.yaml stratos/console
```

#### Create a default Storage Class
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

### Deploying Stratos with your own TLS certificates

By default the console will generate self-signed certificates for demo purposes. To configure Stratos UI to use your provided TLS certificates set the `consoleCert` and `consoleCertKey` overrides.

```
consoleCert: |
    -----BEGIN CERTIFICATE-----
    MIIDXTCCAkWgAwIBAgIJAJooOiQWl1v1MA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
    ...
    -----END CERTIFICATE-----
consoleCertKey: |
    -----BEGIN PRIVATE KEY-----
    MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDV9+ySh0xZzM41
    ....
    -----END PRIVATE KEY-----
``` 
Assuming the above is stored in a file called `override-ssl.yaml`, install the chart with the override specified.
```
helm install -f override-ssl.yaml stratos/console --namespace console
```

### Using with a Secure Image Repository
If you are deploying the helm chart against images that are hosted in a secure image repository provide the following parameters ( store the following to a file called `docker-registry-secrets.yaml`).


```
kube:
  registry:
    hostname: mysecure-dockerregistry.io
    username: john.appleseed
    password: sup3rs3cur3
    # `email` is an optional field
    email: john.appleseed@foobar.com
```

Deploy the chart with the provided parameters:
```
helm install -f docker-registry-secrets.yaml stratos/console
```

### Installing a Nightly Release
Nightly releases are pushed with a `dev` tag. These are strictly for development purposes and should be considered unstable and may contain bugs.

To install the nightly release: 

Update your Helm repositories to ensure you have the latest nightly release information:

```
helm repo update
```

List all versions of the console, to determine the tag.
```
helm search console -l
NAME                 CHART VERSION           DESCRIPTION                       
stratos/console      2.0.0-dev-9a5611dc      A Helm chart for deploying Stratos UI Consoles
stratos/console      1.0.2                   A Helm chart for deploying Stratos UI Console
stratos/console      1.0.0                   A Helm chart for deploying Stratos UI Console
stratos/console      0.9.9                   A Helm chart for deploying Stratos UI Console
stratos/console      0.9.8                   A Helm chart for deploying Stratos UI Console

```
Install

```
helm install stratos/console --namespace=console --name my-console --version 2.0.0-dev-9a5611dc
```

