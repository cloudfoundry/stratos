#!/bin/bash

set -e

echo "Stratos Helm Chart Unit Tests"
echo "============================="

echo "Installing Helm"
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get > get_helm.sh
chmod 700 get_helm.sh
./get_helm.sh

echo "Helm Init (Client)"
helm init --client-only

helm version --client

echo "Install Helm unit test plugin"
helm plugin install https://github.com/cf-stratos/helm-unittest

# Run unit tests
cd deploy/kubernetes
helm unittest console

# Run lint
helm lint console
