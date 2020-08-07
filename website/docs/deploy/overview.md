---
id: overview
title: Deploying Stratos
sidebar_label: Overview
---

Stratos can be deployed in the following environments:

1. Cloud Foundry, as an application. See [guide](cloud-foundry/cloud-foundry)
2. Kubernetes, using a Helm chart. See [guide](kubernetes)
3. Docker, single container deploying all components. See [guide](all-in-one)

> Note: that not all features are enabled in every environment - the Kubernetes deployment supports all features, but Cloud Foundry and Docker deployments do not support some features.

> Note: Some features are marked as 'Tech Preview' and are only available if tech preview features are enabled when deploying.

## Deployed in Cloud Foundry as an application

In this case, Stratos is deployed in a manner optimized for the management of a single Cloud Foundry instance. The 'Endpoints Dashboard' that allows multiple Cloud Foundry endpoints to be registered is not deployed. An extra component is deployed that detects that the Console is running as Cloud Foundry which does the following:

- Automatically detects the Cloud Foundry endpoint and located the UAA Endpoint to use for authentication
- Authenticates directly against the UAA for the Clound Foundry where the Console is deployed and assumes that Cloud Foundry admins are also Console admins (the UAA Scope 'cloud_controller.admin' is used to identify admins)
- Uses a SQLite database rather than Postgres
- Automatically connects to the Cloud Foundry endpoint when a user logs in to simplify the user flow when using the Console in this case

In this case, the front-end web application static resources are served by the API Server back-end rather than a separate web server.

By defaut, a non-persistent SQLite database is used - by automatically registering the cloud foundry endpoint and connecting to it on login, all data stored in the database can be treated as ephimeral, since it will be re-created next time a user logs in. Cloud Foundry Session Affinity is used to ensure that when scaling up the Console Application to multiple instances, the user is also directed to the instance which will know about them and their endpoints (since each Application instance will have its own local SQLite store).

Alternatively, Stratos can be configured [with a persistent Cloud Foundry database service](cloud-foundry/db-migration), which enables features requiring persistence such as user favorites.

## Deployed in Kubernetes

In this case, a Helm chart is used to deploy the Console into a Kubernetes environment.

At the outer-level there are two services - the external service that provides the Console itself and a private service that provides a Postgres DB to the Console service.

The Console service is provided by a deployment consisting of two containers, one providing the static front-end web application resources, served by an nginx instance, the other providing the API Server back-end.

## Deployed in Docker using a single container

In this case, a single Docker image is run in a container that hosts all services together. SQLite is used as the database, so any endpoint metadata registered is lost when the container is destroyed.

This deployment is recommended only for trying out the Console and for development.
