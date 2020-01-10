# Deploying Stratos

The following instructions cover how to:

- Deploy Stratos
- Connect Kubernetes to Stratos to enable Kubernetes views in Stratos
- Deploy Stratos Metrics
- Connect Stratos Metrics to Stratos to enable Metrics views in Stratos

These instructions assume that you are deploying the SUSE Stratos Console and that you have deployed UAA/SCF using a `scf-config-values` configuration file.

## Install Stratos with Helm

> NOTE: Full details on deploying Stratos to Kubernetes are available [here](https://github.com/SUSE/stratos/tree/v2-master/deploy/kubernetes)

> NOTE: These instructions assume that you have added the SUSE Helm Repository with the name 'suse'

To deploy Stratos, use the same `scf-config-values.yaml` file that you used to deploy SCF/UAA.

Ensure you have a Storage Class configured and that is set to be the default - see [here](https://github.com/SUSE/stratos/tree/v2-master/deploy/kubernetes#specifying-a-custom-storage-class) for more information.

Install with:

```
helm install suse/console \
    --name susecf-console \
    --namespace stratos \
    --values scf-config-values.yaml
```

Wait until all pods are in the Ready state.

You can locate the IP and Port that Stratos is running on with:

```
kubectl get service stratos-ui-ext --namespace=stratos
```

This will give output similar to:

```
NAME             TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)                       AGE
stratos-ui-ext   NodePort   172.24.239.140   10.17.3.1     80:30862/TCP,8443:32129/TCP   1h
```

> NOTE: When you log in to Stratos, your SUSE Cloud Foundry dpeloyment should already be registered and connected to Stratos.

## Connecting Kubernetes to Stratos

Stratos can show information from your Kubernetes environment.

To enable this, you must register and connect your Kubernetes environment with Stratos.

In the Stratos UI, go to `Endpoints` in the left-hand side navigation and click on the `+` icon in the top-right on the view - you should be shown the `Register new Endpoint` view.

1. Select `Kubernetes` from the `Endpoint Type` dropdown
1. Enter a memorable name for yor environment in the `Name` field
1. Enter the URL of the API server for your Kubernetes environment
1. Check the `Skip SSL validation for the endpoint` if using self-signed certificates
1. Click `Finish`

The view will refresh to show the new endpoint in the disconnected state.

Next you will need to connect to this endpoint.

1. In the table of endpoints, click the three-dot menu icon alongside the endpoint that you added above
1. Click on 'Connect' in the dropdown menu
1. Select the appropriate authentication type and provide the necessary values (see below for more information)
1. Click `Connect`

Once connected, you should see a `Kubernetes` menu item in the left-hand side navigation - click on this to view the Kubernetes metadata.

### Connecting to Kubernetes

When connecting to Kubernetes you need to provide authentication information in order to connect - the `Auth Type` and information required depends on the Kubernetes platform that you are using:

- For CaaSP, use the Auth Type `CAASP (OIDC)` and provide a valid `kubeconfig` file for your environment

- For Amazon EKS use the Auth Type `AWS IAM (EKS)` and provide the name of your EKS cluster and your AWS Access Key ID and Secret Access Key

- For Azure AKS use the Auth Type `Azure AKS` and provide a valid `kubeconfig` file for your environment

- For Minikube use the Auth Type `Kubernetes Cert Auth` and provide the Certificate and Certificate Key files


> NOTE: For more details - see [here](https://github.com/SUSE/stratos/blob/v2-master/docs/connecting-k8s.md).

## Deploying Metrics

Stratos can show metrics data from Prometheus for both Cloud Foundry and Kubernetes.

In order to do this, you need to deploy the `stratos-metrics` Helm chart - this deploys Prometheus with the necessary exporters that collect data from Cloud Foundry and Kubernetes. It also wraps Prometheus with an nginx server to provide authentication.

As with deploying Stratos, you should deploy the metrics Helm chart using the same `scf-config-values.yaml` file that was used for deploying SCF and UAA.

Create a new yaml file named `stratos-metrics-values.yaml`, with the following contents:

```
kubernetes:
  authEndpoint: $KUBE_SERVER_ADDRESS
prometheus:
  kubeStateMetrics:    
    enabled: true
nginx:
  username: $USERNAME
  password: $PASSWORD 
```

Where:

- `$KUBE_SERVER_ADDRESS` is the same URL that you used when registering your Kubernetes environment with Stratos (the Kubernetes API Server URL).
- `$USERNAME` should be chosen by you as the username that you will use when connecting to Stratos Metrics
- `$PASSWORD` should be chosen by you as the password that you will use when connecting to Stratos Metrics

> Note: If you omit the `nginx` section in this file, the default username and password will be `metrics` and `s3cr3t`.

Install Metrics with:

```
helm install suse/metrics \
    --name susecf-metrics \
    --namespace metrics \
    --values scf-config-values.yaml \
    --values stratos-metrics-values.yaml \
```

Wait until all pods are in the Ready state.

You can locate the IP and Port that Stratos Metrics is running on with:

```
kubectl get service susecf-metrics-metrics-nginx --namespace=metrics
```

This will give output similar to:

```
NAME                           TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE
susecf-metrics-metrics-nginx   NodePort   172.24.218.219   10.17.3.1     443:31173/TCP   13s
```

> Note: If you are using a private container registry, you will need to provide your registry details and credentials in a configuration file - see [here](https://github.com/SUSE/stratos-metrics/blob/master/README.md#deploying-metrics-from-a-private-image-repository) for more details.

## Connecting Stratos Metrics to Stratos

When Stratos Metrics is connected to Stratos, additional views are enabled that show metrics metadata that has been ingested into the Stratos Metrics Prometheus server.

To enable this, you must register and connect your Stratos Metrics instance with Stratos.

In the Stratos UI, go to `Endpoints` in the left-hand side navigation and click on the `+` icon in the top-right on the view - you should be shown the `Register new Endpoint` view.

1. Select `Metrics` from the `Endpoint Type` dropdown
1. Enter a memorable name for yor environment in the `Name` field
1. Enter the URL of your Metrics endpoint
1. Check the `Skip SSL validation for the endpoint` if using self-signed certificates
1. Click `Finish`

The view will refresh to show the new endpoint in the disconnected state.

Next you will need to connect to this endpoint.

1. In the table of endpoints, click the three-dot menu icon alongside the endpoint that you added above
1. Click on 'Connect' in the dropdown menu
1. Enter the username and password for your Stratos Metrics instance
1. Click `Connect`

Once connected, you should see that the name of your Metrices endpoint is a hyperlink and clicking on it should show basic metadata about the Stratos Metrics endpoint.

Metrics data and views should now be available in the UI, for example:

- On the `Instances` tab for an Application, the table should show an additional `Cell` column to indicate which Diego Cell the instance is running on. This should be clickable to navigate to a Cell view showing Cell information and metrics

- On the view for an Application there should be a new `Metrics` tab that shows Application metrics

- On the Kubernetes views, views such as the `Node` view should show an additional `Metrics` tab with metric information
