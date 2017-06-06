#!/usr/bin/env bash

set -e
# Preload images, although kubernetes
# will download missing images for the containers,
# issues have been witnessed for the uaa/mysql container if images are not preloaded.
for image in $(find scf -name *.yml |xargs  grep image | sed 's/.*\(registry.*\)/\1/');
do
    docker pull $image;
done

# Deploy UAA
echo "Deploying UAA..."
pushd scf
helm install scf-uaa --namespace uaa
popd

echo "Waiting for UAA to come up..."
# Make sure pods are ready before proceeding
while ! kubectl get po --namespace=uaa | grep '1/1'; do
    sleep 10
done


# Deploy SCF
pushd scf
echo "Deploying SCF..."
helm install scf --namespace cf
popd


echo "Waiting for SCF to come up..."
while ! kubectl get po --namespace=cf | grep '1/1'; do
    sleep 10
done


echo "All done! :)"
