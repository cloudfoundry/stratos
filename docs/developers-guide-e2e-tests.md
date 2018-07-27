# E2E Tests

The Stratos E2E test suite exercises the Stratos UI using protractor/web-driver.

The tests require a Stratos instance to be running (front-end and back-end) and for a Cloud Foundry to be available to use for testing.

Developers' should be aware that:

- The E2E tests are destructive on the Stratos system being tested - since they test endpoint registration, they will un-register any existing endpoints
- The E2E tests will create orgs, spaces, applications, routes etc in the Cloud Foundry instance that is specified.

## Pre-requisites

The Cloud Foundry being used with the E2E tests requires:

- A user with cloud-controller.admin scope (i.e. an Cloud Foundry admin)
- A user without cloud-controller.admin scope (i.e. a regular Cloud Foundry user)
- An org named 'e2e'
- A space named 'e2e'
- Permissions set so that the regular user is a Space Developer of the 'e2e' space.

Before running the E2E tests, you need to create a file named `secrets.yaml` in the root of the Stratos folder. An example template is included in `src/test-e2e/secrets.yaml.example` - copy this to `secrets.yaml` and edit accordingly.

If you want to run the tests in headless Chrome, add the following to the secrets file:

```
headless: true
```