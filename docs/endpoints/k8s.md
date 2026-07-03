---
title: Kubernetes Endpoints
sidebar_label: Kubernetes
---

[Kubernetes](https://kubernetes.io/) (K8s) is an open-source system for automating deployment, scaling, and management of containerized applications

Stratos provides easy access to Kubernetes features such as

1. Browsing Kubernetes resources and their state
1. Terminal with kubectl (and helm) CLI tools (Tech Preview)
1. Run Security Observability Tools (Tech Preview)
1. Browsing Kubernetes Workloads
1. The Kubernetes Dashboard (Tech Preview)

Adding a Stratos Helm Endpoint alongside a Kubernetes endpoint unlocks additional features

1. Install a Helm chart into the kubernetes
1. Upgrade new or existing Helm charts

## Registering a Kubernetes Endpoint
Stratos Administrator's can register endpoints via the Endpoints page.

Usually all that's needed is the Kubernetes API address, as well as a friendly name to identify the endpoint in Stratos.

Some basic information for finding the endpoint address for specific kubernetes clusters can be found bellow in the connecting section.


## Connecting a Kubernetes Endpoint

Stratos supports a number of different ways to authenticate with your Kubernetes cluster. There are a few generic ways that cover many types of clusters, but also authentication methods specific to some providers.

The currently supported connection methods and types of cluster are:

1. Certificate based Kubernetes authentication
1. Username and password based Kubernetes authentication
1. [SUSE CaaSP](https://www.suse.com/products/caas-platform/) (OIDC)
1. [AWS EKS](https://aws.amazon.com/eks/) (AWS IAM auth)
1. [Azure AKS](https://azure.microsoft.com/en-gb/services/kubernetes-service/)
1. [K3S](https://k3s.io/)


### Certificate based authentication

Some kubernetes clusters use TLS certificates for authentication. The following example shows how to register and connect to one of these called [Minikube](https://minikube.sigs.k8s.io/docs/).

To find the Minikube endpoint URL, locate the `minikube` entry in your local `kubeconfig` file. In the following example, the `minikube` endpoint URL is `https://192.168.99.100:8443`.

```
- cluster:
    certificate-authority: /home/user/.minikube/ca.crt
    server: https://192.168.99.100:8443
  name: minikube
```

To connect to the cluster, locate the relevant entry in the `users` section in your kubernetes config file.

```
users:
- name: minikube
  user:
    client-certificate: /home/user/.minikube/client.crt
    client-key: /home/user/.minikube/client.key

```
The two files specified under `client-certificate` and `client-key` are required to connect to the cluster.
Select the `Kubernetes Cert Auth` option as the Auth Type in the connect dialog and select the two files to connect.

### Username and password based authentication
To connect using a username and password simply select the `Username and Password` option as the Auth Type in the connect dialog.


### CAASP (OIDC)
To connect a CAASP cluster to Stratos, download a `kubeconfig` from Velum.

1. To find the endpoint URL, inspect the file. The `server` property details the endpoint URL

```
apiVersion: v1
kind: Config
clusters:
- name: caasp
  cluster:
    server: https://kube-api-x1.devenv.caasp.suse.net:6443 <---Endpoint URL
    certificate-authority-data: 1c1MFpYSnVZV3dnUTBFd0hoY05NVGd4TURBMU1USXhNalU1V2hjTk1qZ3hNREF5TVRJeE1qVTVXakNCb1RFTApNQWtHQTFVRUJoTUNSRVV4RURBT0JnTlZCQWdNQjBKaGRtRnlhV0V4RWpBUUJnTlZCQWNNQ1U1MWNtVnRZbVZ5Clp6RWJNQmtHQTFVRUNnd1NVMVZUUlNCQmRYUnZaMl...
```
2. Specify the Endpoint URL when adding the endpoint to Stratos.
3. To connect to Kubernetes, select the `CAASP (OIDC)` option as the Auth Type, and upload the `kubeconfig` file downloaded from Velum.

### Amazon EKS
To Connect the following details are required:
- Cluster Name (See the following example)
- AWS Access Key
- AWS Secret Key

#### EKS Endpoint URL And Cluster Name
You can locate the EKS cluster endpoint URL and the cluster name, by inspecting the generated cluster configuration in your local `kubeconfig`. 

```
10:20 $ cat ~/.kube/config 
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUN5RENDQWJDZ0F3SUJBZ0lCQURBTkJna3Foa...QXR2N3dOQkt3eFhsYgpxZm5HRUs0WHRmSWNIcjJHSjhZOXdIa0lPRm0rR3Nvak1PaG1pK05wbER2YjVJc3BmMmxxbXdLd3RmRT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    server: https://40BCD34B7E297903DA2EAF19B6164521.sk1.us-east-1.eks.amazonaws.com
  name: arn:aws:eks:us-east-1:138384977974:cluster/BRSSCF

```
The endpoint URL is specified in the `server` property (i.e. `https://40BCD34B7E297903DA2EAF19B6164521.sk1.us-east-1.eks.amazonaws.com`), while the cluster name is the last part of the `name` property (i.e `BRSSCF`).

### Azure AKS 
To connect an AKS kubernetes instance, the following is required:
1. AKS Endpoint URL, which can be found from the AKS console or the generated kubernetes configuration.
2. To connect to the cluster, provide the `kubeconfig` file.

## For a quick way to registered all endpoints
For a quick way to register kubernetes endpoints and in some cases also connect, the user can select `Import Kubeconfig` instead of the 
endpoint types listed above. Once the user has provided the file they can then select which contexts to register and, if applicable, how to connect to it. Not all connection types are supported this way, for instance where files are reference in config. These can still be registered, and via the Endpoints page connected to, just not connected at that time.
