---
id: deploy-overview
title: Deploying Stratos
sidebar_label: Overview
---

Stratos can be deployed in the following environments:

1. Cloud Foundry, as an application. See [guide](cloud-foundry)
2. Kubernetes, using a Helm chart. See [guide](kubernetes)
3. Docker, single container deploying all components. See [guide](all-in-one)

> Note: that not all features are enabled in every environment - the Kubernetes deployment supports all features, but Cloud Foundry and Docker deployments do not support some features.

> Note: Some features are marked as 'Tech Preview' and are only available if tech preview features are enabled when deploying.