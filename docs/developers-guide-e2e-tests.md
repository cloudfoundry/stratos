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