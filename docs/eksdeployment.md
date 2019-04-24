# Stratos, SCF and metrics on EKS

## EKS Setup

Follow the instructions outlined in https://docs.aws.amazon.com/eks/latest/userguide/getting-started.html to deploy an EKS cluster.

If you plan to deploy SCF in the cluster, make the following modifications when creating the worker nodes.
- Set `NodeInstanceType` to `t2.large`
- Set `NodeInstanceVolume` to `75`

## Helm Setup

Download the latest Helm release (atleast 2.9 is required for RBAC support) from https://github.com/helm/helm/releases

Save the following to a file caleld `helm-rbac.yaml`
```
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tiller
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: tiller
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: tiller
    namespace: kube-system
```

Apply the configuration to the EKS cluster
```
$ kubectl apply -f helm-rbac.yaml
```

Install Helm
```
$ helm init --service-account tiller
```

## Storage Classes 

Two storage classes are required, one general storage class that will be marked as the `default` storage class in the cluster, and a storage class that is scoped to a single `AZ`. This scoped storage class will be used to deploy Stratos and Metrics, that make use of shared storage volumes.

To setup the `default` storage class save the following to a file `default_storage_class.yaml`
```
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp2
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
  labels:
    kubernetes.io/cluster-service: "true"
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
```

To create the storage class, execute the following:
```
$ kubectl apply -f default_storage_class.yaml
```

To setup the scoped storage class, save the following to `scoped_storage_class.yaml`.
```
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: gp2scoped
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
  zone: "us-east-1a"
reclaimPolicy: Retain
mountOptions:
  - debug
```
To create the storage class, execute the following:
```
$ kubectl apply -f scoped_storage_class.yaml
```

In this guide, the scoped storage class will be referred to as `gp2scoped`.
## SCF Installation

To deploy SCF, follow instructions detailed in https://github.com/SUSE/scf/wiki/Deployment-on-Amazon-EKS, starting from the [Deploy Cloud Foundry](https://github.com/SUSE/scf/wiki/Deployment-on-Amazon-EKS#deploy-cloud-foundry) section.

The initial steps can be skipped, (changing storage volume size, helm and storage class configuration). 

The SCF config values file, will be referred to as `scf-config-values.yaml` in the guide.


## Metrics Installation

Download the latest metrics chart from [here](). Or use the latest published `devel` release.

Save the following configuration overrides to a file named `metrics-values.yaml`. 

```
useLb: true
kubernetes:
  authEndpoint: < EKS Cluster endpoint >
prometheus:
  kubeStateMetrics:    
    enabled: true
  server:
    persistentVolume:
      storageClass: gp2scoped
kube:
    external_metrics_port: 443
    storage_class:
        persistent: "gp2scoped"
        shared: "gp2scoped"
```
Deploy `metrics` to your cluster:

```

$ helm install stratos/metrics --namespace metrics --name metrics -f metrics-values.yaml -f scf-config-values.yaml
```

Once all pods are `Ready`, retrieve the load balancer address for the `metrics` Endpoint.

```
$ kubectl get services --namespace metrics
NAME                                    TYPE           CLUSTER-IP       EXTERNAL-IP                                                                            PORT(S)         AGE
metrics-f-exp-service                   ClusterIP      10.100.219.223   <none>                                                                                 9186/TCP        43m
metrics-metrics-nginx                   LoadBalancer   10.100.31.139    a98a9c6f3d5e111e8b51d0eeeba70c15-724925591.us-east-1.elb.amazonaws.com,172.31.34.100   443:30943/TCP   43m
metrics-prometheus-kube-state-metrics   ClusterIP      None             <none>                                                                                 80/TCP          43m
prometheus-service                      ClusterIP      10.100.32.254    <none>                                                                                 9090/TCP        43m

```

The address in this example is `https://a98a9c6f3d5e111e8b51d0eeeofba70c15-724925591.us-east-1.elb.amazonaws.com`. Make a note it.

## Stratos Deployment

To deploy Stratos on EKS, the following configuration overrides are required, save the following to a file named `stratos-values.yaml`.
```
storageClass: gp2scoped
useLb: true
```

Install `stratos` with Helm
```
$ helm install stratos/console -f stratos-values.yaml --namespace stratos --name stratos
```
