# Quick Start

This quick start will take you through installing Stratos using Helm to a Kubernetes cluster.

In this guide, we deploy Stratos with the Technology Preview features enabled and using the built-in Administrator account instead of the Cloud Foundry UAA - thus there is no dependency on any other components.

# Install

You'll need the Helm client installed and Tiller deployed into your Kubernetes cluster.

Add the SUSE Helm repository:

```
helm repo add suse https://kubernetes-charts.suse.com
helm repo update
```

Check that Stratos is available:

```
helm search suse/console
```

You should see output similar to:

```
NAME       	    CHART VERSION	  APP VERSION	  DESCRIPTION                                  
suse/console    2.5.2        	  1.5        	  A Helm chart for deploying Stratos UI Console
```

> Stratos exposes the UI through a Kubernetes service. Before installing, you'll need to decide (for your environment) how to make this service accessible (e.g. NodePort, Load Balancer etc) and add the appropriate configuration when deploying.

Install with the following command:

```
helm install suse/console \
             --name stratos \
             --namespace stratos \
             --set console.techPreview=true \
             --set console.localAdminPassword=changeme \
             --set console.service.type=NodePort
```

You can obviously change the name, namespace and local admin password to suit.

In this example we expose Stratos as a NodePort service.

You can list the services exposed by Stratos with:

```
kubectl get services -n stratos
```

(replacing `stratos` with the namespace you used when installing, if different)

You'll see output similir to this:

```
NAME              TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)         AGE
stratos-mariadb   ClusterIP   10.96.23.192   <none>        3306/TCP        20s
stratos-ui-ext    NodePort    10.108.70.55   <none>        443:31091/TCP   20s
```

> Note: The service `[RELEASE-NAME]-ui-ext` is the external https service for Stratos and you access Stratos via https on this service.

# Getting Started

Open a web browser and navigate to the Stratos https service.

Login with the username `admin` and the password you set when installing (the default used above was `changeme`). When you first login, you'll see a welcome screen.

You'll want to register and connect endpoints into Stratos in order to be able to view them.

## Connecting a CaaSP V4 Kubernetes cluster

To connect a CaaSP cluster, you'll need your Kubeconfig file available.

From your Kubeconfig file, make a note of the server URL for your cluster.

In the Stratos Endpoints view, click the + icon in the top-right and select `SUSE CaaS Platform`. Enter a name for your CaaSP endpoint and then enter the Kubernetes URL from your Kubeconfig file.

Click `Register` and on the next screen, click the checkbox to connect now and browse to your Kubeconfig file and click `Finish`.

Stratos should connect to the Kubernetes Cluster and you should see the Kubernetes functionality appear on the left-hand side navigation. From here you can explore the Kubernetes functionality in Stratos.

# Adding a Helm Repository

To add a Helm Repository, click the + icon from the Stratos Endpoints view.

Select `Helm Repository` and enter a name for the endpoint and the URl of a Helm Repository.

For example, to add the stable charts repository, enter the name `stable` and the URL `https://kubernetes-charts.storage.googleapis.com`.

Click `Finish` and the Helm repository will be synchronized into Stratos and the Helm functionality will appear in the left-hand side navigation. From here you can explore the Helm functionality in Stratos.

