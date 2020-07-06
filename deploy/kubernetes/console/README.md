# Stratos

Stratos is an Open Source Web-based Management console for Cloud Foundry. It allows users and administrators to both manage applications running in the Cloud Foundry cluster and perform cluster management tasks.

## Installation

Stratos can be installed to a Kubernetes cluster using Helm. Either Helm 2 or Helm 3 can be used, although we recommend using the newer Helm 3 version.

Ensure the [Helm](https://github.com/helm/helm) client and [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) CLIs are installed. If you are using Helm 2, ensure you've initialized Tiller into your cluster with the appropriate
Service Account.

The Helm chart is published to the Stratos Helm repository.

You will need to have the Stratos Helm repository added to your Helm setup, if you do not, run:

```
helm repo add stratos https://cloudfoundry.github.io/stratos
```

Check the repository was successfully added by searching for the `console`, for example:

```
helm search repo console
NAME               	CHART VERSION   APP VERSION	DESCRIPTION                                  
stratos/console    	3.2.0           3.2.0      	A Helm chart for deploying Stratos UI Console
```

> Note: Version numbers will depend on the version of Stratos available from the Helm repository

> Note: Commands shown in this document are for Helm version 3. For Helm version 2, when installing, instead of supplying the name via the `--name` flag, it is supplied as the first argument, before the chart name.

To install Stratos:

```
kubectl create namespace console
helm install my-console stratos/console --namespace=console
```

> **Note**: The first `kubectl` command will create a namespace for Stratos. With Helm 3 you must create a namespace before installing.
We recommend installing Stratos into a separate namespace.

> **Note**: This assumes that a storage class exists in the Kubernetes cluster that has been marked as `default`. If no such storage class exists, a specific storage class needs to be specified, please see the following section *Specifying a custom Storage Class*. 

> You can change the namespace (--namespace) and the release name to values of your choice.

This will create a Stratos instance named `my-console` in a namespace called `console` in your Kubernetes cluster.

After the install, you should be able to access the Console in a web browser by following [the instructions](#accessing-the-console) below.

Advanced installation topics are covered in the the [Advanced Topics](#advanced-topics) section below.

# Helm Chart Configuration

The following table lists the configurable parameters of the Stratos Helm chart and their default values.

|Parameter|Description|Default|
|---|---|---|
|imagePullPolicy|Image pull policy|IfNotPresent|
|console.sessionStoreSecret|Secret to use when encrypting session tokens|auto-generated random value|
|console.ssoLogin|Whether to enable SSO Login and use the UAA Login UI instead of the built-in one|false|
|console.backendLogLevel|Log level for backend (info, debug)|info|
|console.service.externalIPs|External IPs to add to the console service|[]|
|console.service.loadBalancerIP|IP address to assign to the load balancer for the metrics service (if supported)||
|console.service.loadBalancerSourceRanges|List of IP CIDRs allowed access to load balancer (if supported)|[]|
|console.service.type|Service type for the console (ClusterIP, NodePort, LoadBalancer, ExternalName etc)|ClusterIP|
|console.service.servicePort|Service port for the console service|443|
|console.service.externalName|External name for the console service when service type is ExternalName||
|console.service.nodePort|Node port to use for the console service when service type is NodePort or LoadBalancer||
|console.ingress.enabled|Enable ingress for the console service|false|
|console.ingress.host|Host for the ingress resource|||
|console.ingress.secretName|Name of an existing secret containing the TLS certificate for ingress|||
|console.service.http.enabled|Enabled HTTP access to the console service (as well as HTTPS)|false|
|console.service.http.servicePort|Service port for HTTP access to the console service when enabled|80|
|console.service.http.nodePort|Node port for HTTP access to the console service (as well as HTTPS)||
|console.templatesConfigMapName|Name of config map that provides the template files for user invitation emails||
|console.userInviteSubject|Email subject of the user invitation message||
|console.techPreview|Enable/disable Tech Preview features|false|
|console.ui.listMaxSize|Override the default maximum number of entities that a configured list can fetch. When a list meets this amount additional pages are not fetched||
|console.ui.listAllowLoadMaxed|If the maximum list size is met give the user the option to fetch all results|false|
|console.localAdminPassword|Use local admin user instead of UAA - set to a password to enable||
|console.tlsSecretName|Secret containing TLS certificate to use for the Console||
|console.mariadb.external|Use an external database instead of the built-in MariaDB|false|
|console.mariadb.database|Name of the database to use|console|
|console.mariadb.user|Name of the user for accessing the database|console|
|console.mariadb.userPassword|Password of the user for accessing the database. Leave blank for the built-in database to generate a random password||
|console.mariadb.rootPassword|Password of the root user for accessing the database. Leave blank for the built-in database to generate a random password||
|console.mariadb.host|Hostname of the database when using an external db||
|console.mariadb.port|Port of the database when using an external db|3306|
|console.mariadb.tls|TLS mode when connecting to database (true, false, skip-verify, preferred)|false|
|uaa.endpoint|URL of the UAA endpoint to authenticate with ||
|uaa.consoleClient|Client to use when authenticating with the UAA|cf|
|uaa.consoleClientSecret|Client secret to use when authenticating with the UAA||
|uaa.consoleAdminIdentifier|Scope that identifies an admin user of Stratos (e.g. cloud_controller.admin||
|uaa.skipSSLValidation|Skip SSL validation when when authenticating with the UAA|false|
|env.SMTP_AUTH|Authenticate against the SMTP server using AUTH command when Sending User Invite emails|false|
|env.SMTP_FROM_ADDRESS|From email address to use when Sending User Invite emails||
|env.SMTP_USER|User name to use for authentication when Sending User Invite emails||
|env.SMTP_PASSWORD|Password to use for authentication when Sending User Invite emails||
|env.SMTP_HOST|Server host address to use for authentication when Sending User Invite emails||
|env.SMTP_PORT|Server port to use for authentication when Sending User Invite emails||
|kube.auth|Set to "rbac" if the Kubernetes cluster supports Role-based access control|"rbac"|
|kube.organization|Registry organization to use when pulling images||
|kube.registry.hostname|Hostname of registry to use when pulling images|docker.io|
|kube.registry.username|Username to use when pulling images from the registry||
|kube.registry.password|Password to use when pulling images from the registry||
|console.podAnnotations|Annotations to be added to all pod resources||
|console.podExtraLabels|Additional labels to be added to all pod resources||
|console.statefulSetAnnotations|Annotations to be added to all statefulset resources||
|console.statefulSetExtraLabels|Additional labels to be added to all statefulset resources||
|console.deploymentAnnotations|Annotations to be added to all deployment resources||
|console.deploymentExtraLabels|Additional labels to be added to all deployment resources||
|console.jobAnnotations|Annotations to be added to all job resources||
|console.jobExtraLabels|Additional labels to be added to all job resources||
|console.service.annotations|Annotations to be added to all service resources||
|console.service.extraLabels|Additional labels to be added to all service resources||
|console.service.ingress.annotations|Annotations to be added to the ingress resource||
|console.service.ingress.extraLabels|Additional labels to be added to the ingress resource||
|console.nodeSelector|Node selectors to use for the console Pod||
|mariadb.nodeSelector|Node selectors to use for the database Pod||
|configInit.nodeSelector|Node selectors to use for the configuration Pod||

## Accessing the Console

To check the status of the instance use the following command:

```
helm status my-console
```

> Note: Replace `my-console` with the value you used for the `name` parameter, or if you did not provide one, use the `helm list` command to find the release name that was automatically generated for you.

The console is exposed via an HTTPS service - `RELEASE-NAME-ui-ext` (where RELEASE-NAME is the name used for the `name` parameter when installing). You can find the details of this service with:

```
kubectl get services -n NAMESPACE
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
my-console-mariadb   ClusterIP   10.105.216.25   <none>        3306/TCP        60s
my-console-ui-ext    NodePort    10.109.207.70   <none>        443:31067/TCP   60s
```

> In this example, Stratos has been deployed withe the service configured as `NodePort`.

The URL you use for accessing Stratos will depend on the service configuration and the environment that you have used.

> Note: If you did not provide a certificate when installing, Stratos will use a self-signed certificate, so you will see a certificate warning which you access Stratos in a browser.

# Upgrading your deployment

To upgrade your instance when using the Helm repository, fetch any updates to the repository:

```
helm repo update
```

To update an instance, the following assumes your instance is called `my-console`:

```
helm upgrade my-console stratos/console
```

After the upgrade, perform a `helm list` to ensure your console is the latest version.

## Uninstalling

To uninstall Stratos, delete the Helm release and also delete the Kubernetes namespace:

```
helm delete my-console --purge
kubectl delete namespace console
```

> Note: Stratos creates secrets in the namespace as part of an initialization job. These are not managed by Helm, so make sure you
delete the namespace to remove these secrets. 

# Advanced Topics

## Using a Load Balancer

If your Kubernetes deployment supports automatic configuration of a load balancer (e.g. Google Container Engine), specify the parameters `console.service.type=LoadBalancer` when installing.


```
kubectl create namespace console
helm install my-console stratos/console --namespace=console --set console.service.type=LoadBalancer
```

## Using an Ingress Controller

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

## Deploying from a Private Image Repository

If the images used by the chart are hosted in a private repository, the following needs to be specified. Save the following to a file called `private_overrides.yaml`. Replace `REGISTRY USER PASSSWORD`, `REGISTRY USERNAME`, `REGISTRY URL` with the appropriate values. `USER EMAIL` can be left blank.

```
kube:
  registry:
    password: <REGISTRY USER PASSWORD>
    username: <REGISTRY USERNAME>
    hostname: <REGISTRY URL>
    email: <USER EMAIL or leave blank>
```

Deploy with:

```
kubectl create namespace console
helm install my-console stratos/console --namespace=console -f private_overrides.yaml
```

## Deploying with your own TLS certificates

By default the console will generate self-signed certificates for demo purposes. To configure Stratos to use your provided TLS certificate, create a TLS secret in the namespace you are installing into and specify this secret name using the helm chart value `console.tlsSecretName` when installing.

Assuming you have your certificate and key in the files `tls.crt` and `tls.key`, create the secret with:

```
kubectl create secret tls -n NAMESPACE stratos-tls-secret --cert=tls.crt --key=tls.key
```

> Where `NAMESPACE` is the namespace you are installing Stratos into - you will need to manually create the namespace first if it does not already exist.

You can now install Stratos with:

```
kubectl create namespace console
helm install my-console stratos/console --namespace=console --set console.tlsSecretName=stratos-tls-secret

```

## Using an External Database

You can choose to use Stratos with an external database, rather than deploying a single-node MariaDB instance as part of the Helm install.

To do so, specify `console.mariabdb.external=true` when deploying.

You will also need to specify:

- `console.mariadb.host` as the hostname of the external MariaDB database server
- `console.mariadb.port` as the port of the external MariaDB database server (defaults to 3306)
- `console.mariadb.tls` as the TLS mode (default is `false,` use `true` for a TLS connection to the database server)
- `console.mariadb.database` as the name of the database
- `console.mariadb.user` as the username to connect to the database server
- `console.mariadb.userPassword` as the password to connect to the database server

When using an external database server, Stratos expects that you have:

- Created a user that will be used to access the database
- Created a database for the Stratos tables and data
- Granted appropriate permissions so that the user can access the database

> Note: When using a database from a Cloud provider, ensure that the username is correct - in some cases this will be `username@servername` - check the provided connection documentation

## Specifying UAA configuration

When deploying with SCF, the `scf-config-values.yaml` (see [SCF Wiki link](https://github.com/SUSE/scf/wiki/How-to-Install-SCF#configuring-the-deployment)) can be supplied when installing Stratos.

```
kubectl create namespace console
helm install my-console stratos/console --namespace=console -f scf-config-values.yaml
```

UAA configuration can be specified by providing the following configuration.

Create a yaml file with the content below and and update according to your environment and save to a file called `uaa-config.yaml`.
```
uaa:
  endpoint: https://uaa.cf-dev.io:2793
  consoleClient:  cf
  consoleClientSecret: 
  consoleAdminIdentifier: cloud_controller.admin 
  skipSSLValidation: false
```

To install Stratos with the above specified configuration:

```
kubectl create namespace console
helm install my-console stratos/console --namespace=console -f uaa-config.yaml
```

## Configuring a local user account

This allows for deployment without a UAA. To enable the local user account, supply a password for the local user in the deployment command, as follows. All other steps for each deployment method should be followed as in the preceding sections above.

To deploy using our Helm repository:

```
kubectl create namespace console
helm install my-console stratos/console --namespace=console --set console.localAdminPassword=<password>
```

## Specifying Annotations and Labels

In some scenarios it is useful to be able to add custom annotations and/or labels to the Kubernetes resources that the Stratos Helm chart creates.

The Stratos Helm chart exposes a number of Helm chart values that cabe specified in order to do this - they are:

|Parameter|Description|Default|
|----|---|---|
|console.podAnnotations|Annotations to be added to all pod resources||
|console.podExtraLabels|Additional labels to be added to all pod resources||
|console.statefulSetAnnotations|Annotations to be added to all statefulset resources|
|console.statefulSetExtraLabels|Additional labels to be added to all statefulset resources||
|console.deploymentAnnotations|Annotations to be added to all deployment resources||
|console.deploymentExtraLabels|Additional labels to be added to all deployment resources||
|console.jobAnnotations|Annotations to be added to all job resources||
|console.jobExtraLabels|Additional labels to be added to all job resources||
|console.service.annotations|Annotations to be added to all service resources||
|console.service.extraLabels|Additional labels to be added to all service resources||
|console.service.ingress.annotations|Annotations to be added to the ingress resource||
|console.service.ingress.extraLabels|Additional labels to be added to the ingress resource||

## Requirements

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


### Specifying a custom Storage Class 

If no default storage class has been defined in the Kubernetes cluster. The Stratos helm chart will fail to deploy successfully. To check if a `default` storage class exists, you can list your configured storage classes with `kubectl`. If no storage class has `(default)` after it, then you need to either specify a storage class override or declare a default storage class for your Kubernetes cluster.

#### Providing Storage Class override
```
kubectl get storageclass
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
kubectl create namespace console
helm install my-console stratos/console --namespace=console -f override.yaml
```

#### Create a default Storage Class

Alternatively, you can configure a storage class with `storageclass.kubernetes.io/is-default-class` set to `true`. For instance the following storage class will be declared as the default. If you don't have the `hostpath` provisioner available in your local cluster, please follow the instructions on [link](https://github.com/kubernetes-incubator/external-storage/tree/master/docs/demo/hostpath-provisioner), to deploy one.

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

See [Storage Class documentation](https://kubernetes.io/docs/tasks/administer-cluster/change-default-storage-class/) for more information.

