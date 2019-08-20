# Stratos on EKS

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

Stratos requires a storage class that is scoped to a single `AZ`.

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
