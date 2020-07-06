# Deploying in Kubernetes

Stratos can be deployed to Kubernetes using [Helm](https://github.com/kubernetes/helm).

As part of the Stratos release process, a Helm chart is generated and added to the release artifacts for a given release. In addition, we maintain a Helm Chart repository that can be used to install Stratos from:

`https://cloudfoundry.github.io/stratos`

You will need a suitable Kubernetes environment and a machine from which to run the deployment commands.

You will need to have both the `kubectl` and `helm` CLIs installed and available on your path. It should be appropriately configured to be able to communicate with your Kubernetes environment.

The Stratos Helm chart contains a `README.md` file that contains installation instructions and configuration documentation.

This document is also available in our GitHub repository here: [README.md](https://github.com/cloudfoundry/stratos/blob/master/deploy/kubernetes/console/README.md).
