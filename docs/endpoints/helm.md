---
title: Helm Endpoints
sidebar_label: Helm
---

[Helm](https://helm.sh/) is a tool that streamlines installing and managing Kubernetes applications.

Stratos unlocks the ability to 

1. Browse Helm charts in a single page from one or more Helm chart repositories
1. View detailed information about a Helm Chart
1. Review past version of a Helm Chart

Adding a Stratos Kubernetes Endpoint alongside Helm endpoint unlocks additional features

1. Install a Helm chart into the kubernetes
1. Supply values for the install via either a dynamically created form or freehand syntax checked yaml 
1. Upgrade new or existing Helm charts


## Registering a Helm Endpoint
Stratos Administrator's can register endpoints via the Endpoints page.

To add a Helm Repository all that's needed is the url that hosts the repositories chart.yaml.

Nothing is needed to register Artifact Hub, just the administrators inclination.


## Connecting to Helm Endpoint

Helm endpoints don't require user credentials. Once they're registered they're available to all.