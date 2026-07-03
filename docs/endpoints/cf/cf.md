---
title: Cloud Foundry Endpoints
sidebar_label: Introduction
---

[Cloud Foundry](https://www.cloudfoundry.org/) is the industry-standard open source cloud application platform for developing and deploying
enterprise cloud applications. 

Stratos provides easy access to many of Cloud Foundry's features such as

1. Browsing, deploying and managing applications
1. Browsing services, and creating and managing service instances
1. Managing Organisations and Spaces
1. User role management
1. ... and much more

## Registering a Cloud Foundry Endpoint
Stratos Administrator's can register endpoints via the Endpoints page.

The CF API address must be supplied.

The Client ID and Client Secret can usually be left blank (by default stratos will use `cf` as the client id). If you would like Stratos
to communicate with the cf using a specific client enter them here.

To allow the user to connect to the endpoint via SSO check the box. Some of the information in the [Stratos SSO Guide](../../advanced/sso)
may be helpful.

## Connecting to a Cloud Foundry Endpoint

Simply navigate to the Endpoints page, find the Cloud Foundry endpoint, click connect and enter your Cloud Foundry username and password.
