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

The Client ID and Client Secret can usually be left blank. Stratos then
uses its own client, the one set by `CF_CLIENT` (`cf` when unset).

The client must allow the way users connect:

- **Username and password** needs a client with the `password` grant. If it
  lacks it, Connect reports "Unauthorized grant type". `cf`, the client the
  cf CLI uses, has it in a standard Cloud Foundry.
- **SSO** ("Allow SSO login") needs a client with the `authorization_code`
  grant and the Stratos SSO callback in its `redirect_uri`. If the callback
  is missing, the login server stops with "Invalid redirect". `cf` does not
  have it by default.

A console set up for SSO often has a client that allows SSO but not
passwords. For endpoints that users connect to with a password, enter `cf`
as the Client ID, with no secret. Your UAA administrator can tell you what a
client allows (`uaac client get <client id>`).

To allow the user to connect to the endpoint via SSO check the box. Some of the information in the [Stratos SSO Guide](../../advanced/sso.md)
may be helpful.

## Connecting to a Cloud Foundry Endpoint

Simply navigate to the Endpoints page, find the Cloud Foundry endpoint, click connect and enter your Cloud Foundry username and password.
