---
id: developers-guide-e2e-tests
title: E2E Tests
sidebar_label: E2E Tests
---

The Stratos E2E test suite exercises the Stratos UI using [Playwright](https://playwright.dev/).

The tests require a Stratos instance to be running (front-end and back-end) and for a Cloud Foundry to be available to use for testing.

Developers' should be aware that:

- The E2E tests are destructive on the Stratos system being tested - since they test endpoint registration, they will un-register any existing endpoints.
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
More information can be found [below](#running-the-e2e-set-up-script).

Before running the E2E tests, you need to create a file named `secrets.yaml` in the root of the Stratos folder. An example template is included in [e2e/secrets.yaml.example](https://github.com/cloudfoundry/stratos/blob/main/e2e/secrets.yaml.example) - copy this to `secrets.yaml` and edit accordingly.

If you want to run the tests in headless Chrome, add the following to the secrets file:

```
headless: true
```

## Running the E2E Set up Script
The script can be found in [deploy/tools/init-cf-for-e2e.sh](https://github.com/cloudfoundry/stratos/blob/main/deploy/tools/init-cf-for-e2e.sh)

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
If tests are stopped before completing or fail to clean old test artifacts will exist in the CF. Run `make e2e clean` to remove the
CF resources the tests label `stratos-e2e-test` (add `DRYRUN=yes` to see what it would delete).

## Running the tests

To run the tests, starting a local Stratos for them on dedicated ports, execute
```bash
make test e2e
```

To run them against a Stratos that is already running, set `E2E_BASE_URL`. For the dev frontend started with `make dev frontend`:
```bash
make test e2e E2E_BASE_URL=https://localhost:5440
```

Additional test commands:
- `bun run e2e:ui` - Run tests with Playwright UI mode
- `bun run e2e:debug` - Run tests in debug mode
- `bun run e2e:headed` - Run tests in headed mode (see browser)
- `bun run e2e:report` - View test report
