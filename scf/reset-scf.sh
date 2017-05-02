#!/usr/bin/env bash


# Delete UAA
kubectl delete namespace uaa

sleep 60

kubectl create namespace uaa
kubectl create -n uaa -f scf/uaa-kube/bosh/
kubectl create -n uaa -f scf/uaa-kube/exposed-ports.yml

# Make sure pods are ready before proceeding
while kubectl get po --namespace=uaa | grep '0/1' 2> /dev/null ; do
    sleep 10
done


kubectl delete namespace cf

sleep 60

kubectl create namespace cf
kubectl create -n cf -f scf/scf-kube/bosh
kubectl create -n cf -f scf/scf-kube/bosh-task/post-deployment-setup.yml
kubectl create -n cf -f scf/scf-kube/bosh-task/autoscaler-create-service.yml
kubectl create -n cf -f scf/scf-kube/bosh-task/sso-create-service.yml


# Make sure pods are ready before proceeding
while kubectl get po --namespace=cf | grep '0/1' 2> /dev/null ; do
    sleep 10
done

echo All done!


