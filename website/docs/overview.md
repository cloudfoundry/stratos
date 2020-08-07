---
id: overview
title: Stratos Overview
sidebar_label: Overview 
---

Stratos provides a web-based UI to allow developers and administrators to manage their applications and cloud foundry deployment(s).

It is designed to manage one or more Cloud Foundry deployments. It does so by managing "endpoints", where each endpoint is a reference to a Cloud Foundry deployment. The notion of an endpoint is not specific to Cloud Foundry, allowing Stratos to connect to other service types in the future.

Stratos stores endpoint metadata in a relational database. Administrators of Stratos are able to register (add) new endpoints to the Console. All users are able to then connect to these endpoints using their credentials, ensuring that they get the appropriate level of access when interacting with Cloud Foundry.

The high-level architecture of Stratos is shown in the diagram below:

![Stratos High-Level Architecture](../images/high-level-arch.png)

The main components:

* Web UI - Single-page AngularJS web application providing the front-end that runs in the user's browser.
* API Server - Provides the back-end APIs that support the front-end UI. This API takes care of authentication, endpoint management and proxying API requests from the front-end to the desired back-end API.
* Endpoint Datastore - Relational database that stores the registered endpoints and the encrypted user access tokens.

## Authentication

Stratos authenticates users using a Cloud Foundry UAA service. It must be configured with the details necessary to communicate with a UAA. When the user logs in to the Console, their login will be validated with the UAA. The Console uses a scope to identify Console administrators from regular users.

Administrators use the 'Endpoints Dashboard' within the Console to add new endpoints to the Console. All users are then able to connect to these endpoints by providing their credentials. The Console will use these credentials to communicate with the UAA for the given endpoint (typically Cloud Foundry) and obtain a refresh and access token. These tokens are encrypted and stored in the Endpoint Datastore.

When a user interacts with the Console and API requests need to be made to a given Cloud Foundry endpoint, these are sent to the API Server along with a custom http header which indicated which endpoint(s) the requests should be send to. The API Server will forward the request to the appropriate endpoints, first looking up the access and refresh tokens required to communicate with the endpoint(s). If any access token has expired, it will use the refresh token to obtain a new access token.
