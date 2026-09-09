---
id: kubernetes
title: Deploying in Kubernetes
sidebar_label: Overview 
---

Stratos can be deployed to Kubernetes using [Helm](https://helm.sh).

> [!WARNING]
> The Kubernetes deployment path does not currently work. The chart in this
> repository (`deploy/kubernetes/console`) references container images that have
> not been built since 2020 and cannot be rebuilt from the current source tree,
> and there is no published Stratos Helm chart repository. The `stratos/console`
> chart named in the installation guide is not available anywhere. See
> [#5907](https://github.com/cloudfoundry/stratos/issues/5907) for the status of
> this path. Use the [Cloud Foundry](cloud-foundry/cloud-foundry.md) or
> [all-in-one Docker](all-in-one.md) deployment instead.

You will need a suitable Kubernetes environment and a machine from which to run the deployment commands.

You will need to have both the `kubectl` and `helm` CLIs installed and available on your path. It should be appropriately configured to be able to communicate with your Kubernetes environment.

The Stratos Helm chart contains a `README.md` file that contains installation instructions and configuration documentation.

This document is also available in [here](kubernetes/install.md).
