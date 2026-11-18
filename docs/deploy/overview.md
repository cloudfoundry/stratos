---
id: overview
title: Deploying Stratos
sidebar_label: Overview
---

## Deployment Types

Stratos can be deployed in the following environments:

1. Cloud Foundry, as an application. See [guide](cloud-foundry/cloud-foundry.md)
2. Kubernetes, using a Helm chart. See [guide](kubernetes.md)
3. Docker, single container deploying all components. See [guide](all-in-one.md)

> [!WARNING]
> The Kubernetes deployment does not currently work — no chart or component
> images are published, and the images the chart expects cannot be rebuilt from
> the current source tree. See
> [#5907](https://github.com/cloudfoundry/stratos/issues/5907). Cloud Foundry and
> Docker are the working deployment options.

> [!NOTE]
> Not all features are enabled in every environment - the Kubernetes deployment is designed to support all features, but Cloud Foundry and Docker deployments do not support some features.

### Deployed in Cloud Foundry as an application

In this case, Stratos is deployed in a manner optimized for the management of a single Cloud Foundry instance.

For more information see the [guide](cloud-foundry/cloud-foundry.md).

### Deployed in Kubernetes

In this case, a Helm chart is used to deploy the Console into a Kubernetes environment.

At the outer-level there are two services - the external service that provides the Console itself and a private service that provides a Postgres DB to the Console service.

The Console service is provided by a deployment consisting of two containers, one providing the static front-end web application resources, served by an nginx instance, the other providing the API Server back-end.

### Deployed in Docker using a single container

In this case, a single Docker image is run in a container that hosts all services together. SQLite is used as the database, so any endpoint metadata registered is lost when the container is destroyed.

This deployment is recommended only for trying out the Console and for development.

## Enable/Disable Features

> [!NOTE]
> Some features are marked as 'Tech Preview' and are only available if tech preview features are enabled when deploying. See the [Tech Preview](tech-preview.md) section for more information.

Frontend Packages and Backend Plugins can be removed at build time, see [here](../extensions/disable-packages.md) for more information.
## Background Operations

A slow operation (a broker that takes minutes, a delete Cloud Foundry runs as
a job) is followed by the browser after the page that started it hands it
off. After `ASYNC_JOB_TRACKING_LIMIT_IN_MINS` minutes (default 60) the browser
stops checking and says so; the operation itself carries on in Cloud Foundry.
Values under 1 use 1 minute. Values over 360 (6 hours) are used but log a
warning, since every browser tab follows an operation that long. Values of
1440 (a day) or more use 360.

| Deployment | How to set it |
|------------|---------------|
| Cloud Foundry | `cf set-env console ASYNC_JOB_TRACKING_LIMIT_IN_MINS 120`, then restage |
| Kubernetes (Helm) | `--set console.ui.jobTrackingLimitMins=120` |
| Docker, single container | `docker run -e ASYNC_JOB_TRACKING_LIMIT_IN_MINS=120 ...` |

To choose a value from your own foundation's numbers, the backend logs one
line at Info level for each operation it handed off, when it ends:

```
level=INFO msg="job ended" kind=cf.service_instance.create outcome=complete seconds=42 rebuilt=false
```

`outcome` is `complete`, `failed`, `not_found` (Cloud Foundry no longer knows
the job) or `abandoned`: nobody checked on it for an hour, because the browser
reached the limit or was closed. For `abandoned`, `seconds` runs to the last
check, so the operation took at least that long, and the line appears an hour
after that check. `rebuilt=true` marks an operation another backend instance
started; its `seconds` start when this instance picked it up. Operations that
finish within the first 3 seconds are never handed off and are not logged.
The lines go to standard output with the rest of the backend's log
(`cf logs`, `kubectl logs`, `docker logs`); set `LOG_TO_JSON=true` for JSON.
