#!/bin/bash

set -e

echo "Stratos Helm Chart Unit Tests"
echo "============================="

echo "Installing Helm"
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get > get_helm.sh
chmod 700 get_helm.sh
./get_helm.sh

echo "Helm Init"
# Helm init will fail as there is no cluser - we just want to use it client-side
set +e
helm init
set -e

echo "Install Helm unit test plugin"
helm plugin install https://github.com/lrills/helm-unittest

# Run unit tests
cd deploy/kubernetes
helm unittest console
