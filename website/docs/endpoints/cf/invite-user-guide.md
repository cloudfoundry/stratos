---
title: Configuring Invite User Support
sidebar_label: Configuring User Invites
---

Stratos provides a way for Cloud Foundry administrators and organization managers to invite users to an organization or space.

During the invite process the following actions will occur:

- A UAA user and a CF user will be created.
- Initial roles will be assigned. User will be added as an organization member and, if selected, a space role.
- Users will be emailed a verification link. The link directs the user to a UAA site to set their password.

> Note - The user *will not* be able to log in without first setting their password but CF admins, organization managers and space managers *will* be able to set roles for the user.

## Set up

In order to enable User Invite support in Stratos:

1. A UAA client must be created with appropriate permissions to create users
1. Stratos must be configured with the details of the SMTP server to use when sending emails
1. (Optionally) The email templates used for sending emails should be modified
1. User Invite support must be enabled in Stratos by an Administrator

Once all of the steps have been completed, CF administrators and organization managers will be able to invite users via the Organization and Space pages under the 'Users' tab.

These steps are covered below.

## Creating a UAA Client for User Invites

Stratos requires a pre-configured UAA client to invite the UAA user and create the CF user. The client requires both the `scim.invite` and `cloud_controller.admin` scopes.

To create a client with the correct scopes, use the following [UAA CLI](https://github.com/cloudfoundry/cf-uaac) command:

```
uaac client add stratos-invite --scope scim.invite,cloud_controller.admin --authorized_grant_types client_credentials --authorities scim.invite,cloud_controller.admin -s password
```

> Note - Include the uaa scope if required.

In the above example the client id is `stratos-invite` and client secret is `password`.

Alternatively, you can use an existing UAA Client, if one is already available with the appropriate scopes.

> Note: You will need the Client ID and Client Secret used above when enabling User Invite support in Stratos

## Configuring SMTP Server details and (optionally) modifying Email Templates

Configuration depends on how you have deployed Stratos.

1. For cf push, see [Configuration for CF Push](#configuration-for-cf-push)
1. For Kubernetes with Helm, see: [Configuration for Helm Installation](#configuration-for-helm-installation)

## Enabling User Invite support in Stratos

This action must be performed by an Administrator in Stratos.

1) Navigate to the Cloud Foundry Summary page of the required CF.
1) Use the `Configure` button in the `User Invitation Support` section.
1) Supply the uaa client id and secret and click `Configure`

> Note: If Stratos has been deployed via `cf push` and the steps under the `Pre-configure invite UAA client` header in the  [CF deploy guide](../../deploy/cloud-foundry/cloud-foundry.md)  have been followed, you will not follow these steps for the default CF.

## Configuration for CF Push

When deploying Stratos to Cloud Foundry using `cf push`, User Invites can be configured as follows.

### General Configuration

The following configuration is required in order to configure the SMTP server and email subject:

|Environment Variable|Purpose|
|---|---|
|SMTP_HOST|Host name of the SMTP server|
|SMTP_PORT|Port name of the SMTP server|
|SMTP_AUTH|Whether to authenticate against the SMTP server using AUTH command (set to "true")|
|SMTP_FROM_ADDRESS|From email address to use when sending emails|
|SMTP_USER|Username to use when authenticating with the email server|
|SMTP_PASSWORD|Password to use when authenticating with the email server|
|INVITE_USER_SUBJECT|Subject line to use when sending an invitation email|

### Using custom templates

To use custom email templates, create a folder and add the two templates with the following file names:

1. user-invite-email.txt = Plain text template
1. user-invite-email.helm = HTML text template

When deploying Stratos with `cf push` set the environment variable `TEMPLATE_DIR` to the folder name where your custom templates are located. This can be done on the command line or by adding this environment variable to the `manifest.yml` file.

## Configuration for Helm Installation

When deploying Stratos to Kubernetes using Helm, User Invites can be configured as follows.

### General Configuration

The following configuration is required in order to configure the SMTP server and email subject:

|Helm Chart Value|Purpose|
|---|---|
|env.SMTP_HOST|Host name of the SMTP server|
|env.SMTP_PORT|Port name of the SMTP server|
|env.SMTP_AUTH|Whether to authenticate against the SMTP server using AUTH command (set to "true")|
|env.SMTP_FROM_ADDRESS|From email address to use when sending emails|
|env.SMTP_USER|Username to use when authenticating with the email server|
|env.SMTP_PASSWORD|Password to use when authenticating with the email server|
|console.userInviteSubject|Subject line to use when sending an invitation email|

### Using custom templates

If you wish to use custom email templates for user invitation, follow these steps:

Create the namespace that you are going to use when installing Stratos:

```
kubectl create namespace stratos
```

Create a Config Map for the template files - this assumes you have the following two files in the current directory:

1. user-invite-email.txt = Plain text template
1. user-invite-email.helm = HTML text template

Create the Config Map with:

```
kubectl create configmap stratos-templates --namespace stratos --from-file=./user-invite-email.txt --from-file=./user-invite-email.html
```

When deploying Stratos using Helm, ensure you set the the Helm Value:

```
console.templatesConfigMapName
```

to the name of the Config Map that you created - e.g. in the example above, add the following to the `helm install` command:

```
--set console.templatesConfigMapName=stratos-templates
```

## Development Notes

When developing locally, we recommend using [mailcatcher](https://mailcatcher.me/) in place of an actual SMTP server.

To install mailcatcher via docker, use the following command: `docker run -d -p 1080:80 -p 1025:25 --name mail tophfr/mailcatcher`. Once mailcatcher is installed, continue to follow the instructions below.

SMTP server details can be set via rhe usual environment variable approach or, when running locally, in the `jetstream/config.properties` file (see Backend Development - Configuration in [developers-guide](../../developer/introduction)). The config settings, with example values, are as follows:

```
SMTP_FROM_ADDRESS=Stratos<test@test.com>
SMTP_HOST=127.0.0.1
SMTP_PASSWORD=
SMTP_PORT=1025
SMTP_USER=
TEMPLATE_DIR=./templates
```
