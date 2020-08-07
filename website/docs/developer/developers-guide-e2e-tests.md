---
id: developers-guide-e2e-tests
title: E2E Tests
sidebar_label: E2E Tests 
---

The Stratos E2E test suite exercises the Stratos UI using protractor/web-driver.

The tests require a Stratos instance to be running (front-end and back-end) and for a Cloud Foundry to be available to use for testing.

Developers' should be aware that:

- The E2E tests are destructive on the Stratos system being tested - since they test endpoint registration, they will un-register any existing endpoints
- The E2E tests will create orgs, spaces, applications, routes, etc in the Cloud Foundry instance that is specified. Tests should automatically tidy up afterwards unless stopped abruptly.

## Pre-requisites

### NPM
The test run via NPM, which should be installed the normal way.

### Cloud Foundry
The tests require an instance of Cloud Foundry with the following:

- A user with cloud-controller.admin scope (i.e. an Cloud Foundry admin)
- A user without cloud-controller.admin scope (i.e. a regular Cloud Foundry user)
- A user which both scim.invite and cloud_controller.admin (i.e. a Cloud Foundry user that can use the invite user feature)
- A number of pre-existing orgs, spaces with appropriate roles applied to the admin and non-admin users
- A number of other Cloud Foundry entities

To meet the above requirements we recommend running the Stratos CF E2E set up script which is kept up to date with the latest test requirements.
More information can be found [below](#running-the-e2e-set-up-script)

Before running the E2E tests, you need to create a file named `secrets.yaml` in the root of the Stratos folder. An example template is included in [src/test-e2e/secrets.yaml.example](https://github.com/cloudfoundry/stratos/blob/master/src/test-e2e/secrets.yaml.example) - copy this to `secrets.yaml` and edit accordingly.

If you want to run the tests in headless Chrome, add the following to the secrets file:

```
headless: true
```

## Running the E2E Set up Script
The script can be found in [deploy/tools/init-cf-for-e2e.sh](https://github.com/cloudfoundry/stratos/blob/master/deploy/tools/init-cf-for-e2e.sh)

### Minimum Requirements
- CF CLI
- UAA CLI
- A user with cloud-controller.admin scope (i.e. an Cloud Foundry admin)

### Script Output
The script does a number of things, including but not exclusively...
- Creates test CF users
- Creates an organisation and space to test a subset of features in, including assigning roles to certain configured users
- Clones a basic CF application from github and pushes to the test org/space
- Creates a new user in uaa which will be used to configure the Invite User feature
- Enables deploying applications from docker
- Creates a number of public, private and space scoped services from applications it pushes to CF

### Running the Script
Please see the file itself for a list of required properties. Some have defaults in. We would recommend updating at least
- ADMIN - Username for the CF admin
- ADMIN_PASS - Password for the CF admin
- CF_API_ENDPOINT - CF to test against
- UAA_CLI_CMD - UAA CLI command
- UAA_ENDPOINT - UAA endpoint used by CF
- ADMIN_CLIENT_SECRET - UAA admin client's secret
- UAA_ZONE - Leave blank if no zone is required

### Configure Tests To Use Script Output
Given the output of the script, the following template can be used to update the CF section of `secrets.yaml`

```
  cf:
  - name: cf
    url: <CF_URL>
    skipSSLValidation: true
    testOrg: e2e
    testSpace: e2e
    testService: app-autoscaler
    services:
      bindApp: go-env
      publicService:
        name: public-service
      privateService:
        name: private-service
        invalidOrgName: test-e2e
        invalidSpaceName: test-e2e
      spaceScopedService:
        name: space-scoped-service
        invalidOrgName: test-e2e
        invalidSpaceName: test-e2e
    creds:
      admin:
        username: <CF_ADMIN_USERNAME>
        password: <CF_ADMIN_PASSWORD>
      nonAdmin:
        username: e2e
        password: changeme
      removeUser:
        username: e2e-remove-user
        password: changeme
    invite:
      clientId: stratos-invite
      clientSecret: changeme
    uaa:
      creds:
        clientId: <uaa client id>
        clientSecret: <uaa client secret>
      tokenEndpoint: <uaa endpoint>
      zone: <uaa zone>
```

### Tidying up test generated CF entities
If tests are stopped before completing or fail to clean old test artifacts will exist in the CF. To clean some of these please see the script
at [deploy/ci/automation/e2e-clean-remnants.sh](https://github.com/cloudfoundry/stratos/blob/master/deploy/ci/automation/e2e-clean-remnants.sh)

## Running the tests

To run the tests against an instance of Stratos execute
```
npm run e2e -- --dev-server-target= --base-url=<URL of stratos
```


## Running tests on Browserstack

You can run the E2E tests on Browserstack instead of with a local browser.

To do so, configure the following environment variables:

|Variable|Required|Description|
|---|---|---|
|BROWSERSTACK_USER|Yes|Your Browserstack user ID|
|BROWSERSTACK_KEY|Yes|Your Browserstack key|
|BROWSERSTACK_TARGET|Yes|The Browser (and OS) to use (see below)|
|BROWSERSTACK_PROJECT|No|Project name|
|BROWSERSTACK_BUILD|No|Build name|
|BROWSERSTACK_NAME|No|Name|
|BROWSERSTACK_RESOLUTION|No|Screen resolution to use|

For more information on project, build and name, see: https://www.browserstack.com/automate/capabilities.

The `BROWSERSTACK_TARGET` environment variable can be just a Browser name, e.g. `Chrome`, or a name and version (separated by a space), e.g. `Chrome 69`.

You can also specify which OS to use by separating the OS and browser with a `/`, e.g. `Windows/Chrome`. You can also specify the OS version by separating with a space, e.g. `Windows 10/Chrome`. You can fully described the OS and Browser with `Windows 10/Chrome 69`.

For more information on supported Operating Systems/devices and browsers, see https://www.browserstack.com/list-of-browsers-and-platforms?product=js_testing and https://www.browserstack.com/automate/protractor.

As an example, to run the E2E tests against a locally run Stratos dev system, use:

```
BROWSERSTACK_TARGET="Chrome" npm run e2e-dev
```

> Note: This assumes you have set the `BROWSERSTACK_USER` and `BROWSERSTACK_KEY` environment variables already.

Running the tests in this manner uses the browserstack-local npm package to allow the tests to run against your local system. To ensure that `BrowserStackLocal` processes are not left running if a test run is aborted, all `BrowserStackLocal` processes are terminated when the E2E test process exits.

> Note: When the E2E tests are run using BrowserStack, the test reporter is modified to include timing information to help correlate tests to the captured video of the test run.