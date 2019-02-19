# Invite User Guide

Stratos provides a way for Cloud Foundry administrators and organization managers to invite users to an organization or space.

During the invite process the following actions will occur:

- A UAA user and a CF user will be created.
- Initial roles will be assigned. User will be added as an organization member and, if selected, a space role.
- Users will be emailed a verification link. The link directs the user to a UAA site to set their password.

> Note - The user *will not* be able to log in without first setting their password but CF admins, organization managers and space managers *will* be able to set roles for the user.

## Development SMTP server

 To run locally, we recommend using [mailcatcher](https://mailcatcher.me/) in place of an actual SMTP server.

 To install mailcatcher via docker, use the following command: `docker run -d -p 1080:80 -p 1025:25 --name mail tophfr/mailcatcher`. Once mailcatcher is installed, continue to follow the instructions below.

## Set up

There are number of set up steps to execute first:

1) Supply SMTP server details for Jetstream to use to send out verification email. This can be done via the usual environment variable
   approach or, when running locally, in the jetstream/config.properties file (see Backend Development - Configuration in [developers-guide](./developers-guide.md)). The config settings, with example values, are as follows:

   ```
   SMTP_FROM_ADDRESS=Stratos<test@test.com>
   SMTP_HOST=127.0.0.1
   SMTP_PASSWORD=
   SMTP_PORT=1025
   SMTP_USER=
   TEMPLATE_DIR=./templates
   ```

2) Update the default email templates.

   Default templates are found in `src/jetstream/templates`.

3) Create/Locate a UAA client with required scopes.

   Stratos uses a pre-configured UAA client to invite the UAA user and create the CF user. The client requires both the `scim.invite` and `cloud_controller.admin` scopes.

   If you would like to create a client with the correct scopes, use following [UAA CLI](https://github.com/cloudfoundry/cf-uaac) command:

   ```
   uaac client add stratos-invite --scope scim.invite,cloud_controller.admin --authorized_grant_types client_credentials --authorities scim.invite,cloud_controller.admin -s password
   ```

   > Note - Include the uaa scope if required.

   In the above example the client id is `stratos-invite` and client secret is `password`.

4) In Stratos, set uaa client by following the below steps:

   > If the console has been deployed via `cf push` and the steps in under the `Pre-configure invite UAA client` header in the  [CF deploy guide](../deploy/cloud-foundry/README.md)  have been followed, you will not follow these steps for the default CF.

   1) Navigate to the Cloud Foundry Summary page of the required CF.
   2) Use the `Configure` button in the `User Invitation Support` section.
   3) Supply the uaa client id and secret and click `Configure`

Once all of the steps have been completed, CF administrators and organization managers will be able to invite users via the Organization and Space pages under the 'Users' tab.