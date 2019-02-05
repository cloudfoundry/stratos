# Invite User Guide

Stratos provides a way for Cloud Foundry administrators, organization managers and space managers to invite users to an organization or space.

During the invite process

- A UAA and CF User will be created
- Initial roles will be assigned. User will be added as an organization member and if applicable a pre-selected space role.
- Users will be emailed a verification link. The link directs the user to a UAA site to set their password.

> Note - The user will not be able to log in without first setting their password, however CF admins, organization managers and space managers will still be able to set roles for the user

## Set up

There are number of set up steps to execute first.

1) Supply SMTP server details for Jetstream to use to send out verification email. This can be done via the usual environment variable
   approach or in the dev world in the config.properties file. The config settings, with example values, are as follows

   ```
   SMTP_FROM_ADDRESS=Stratos<test@test.com>
   SMTP_HOST=127.0.0.1
   SMTP_PASSWORD=
   SMTP_PORT=1025
   SMTP_USER=
   TEMPLATE_DIR=./templates
   ```

   > Note - In the dev world use [tophfr/mailcatcher](https://hub.docker.com/r/tophfr/mailcatcher/) in place of an actual SMTP server
   > (`docker run -d -p 1025:25 1080:80 tophfr/mailcatcher` will bring up image, access the UI via `http://localhost:1080` and use the `config.properties` from above)

2) Update the default email templates

   Default templates are found, as per example configuration above, in `src/jetstream/templates`

3) Create/Locate a UAA client with required scopes

   Stratos uses a pre-configured UAA client to invite the UAA user and create the CF user. In needs both `scim.invite` and `// TODO: UPDATE`
   To manually create such a user using the UAA CLI the following command can be used

   ```
   uaac client add stratos-invite --scope scim.invite `// TODO: UPDATE` --authorized_grant_types client_credentials --authorities scim.invite -s password
   ```

   In the above example the client id is `stratos-invite` and client secret `password`

4) In Stratos set uaa client
   1) Navigate to the Cloud Foundry Summary page of the required CF
   2) Use the `Configure` button in the `User Invitation Support` section
   3) Supply the client id and secret and click `Configure`

At this point CF administrators, organization managers and space managers should be able to invite a user via the Organization/Space Users table
