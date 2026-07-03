---
title: Stratos Metrics Endpoints
sidebar_label: Introduction
---

[Stratos Metrics](https://github.com/SUSE/stratos-metrics) is a Prometheus instance drawing in metrics via Cloud Foundry and Kubernetes exporters.

Adding a Stratos Metrics Endpoint will provide

1. Application and diego cell metrics (via the CF firehose exporter)
1. Kubernetes node and pod metrics (via the kube state metrics exporter)

## Installing

Information on installing Stratos Metrics to Kubernetes with Helm can be found [here](https://github.com/SUSE/stratos-metrics#installation).

## Registering a Metrics Endpoint
Stratos Administrator's can register endpoints via the Endpoints page.

All that's needed is the url for the metrics nginx service, as well as a friendly name to identify the endpoint in Stratos

## Connecting a Metrics Endpoint

The username and password of the metrics instance is required. An administrator can connect and share these credentials with all other users via `Share this endpoint connection`