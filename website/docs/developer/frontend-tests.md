---
title: Frontend Tests
sidebar_label: Tests
---

## Test

### Lint

Run `npm run lint` to execute tslint lint checking.

### Unit tests

Run `npm test` to execute the unit tests via [Vitest](https://vitest.dev). Coverage information can be found in `./coverage`

To execute an individual package run `npm run test:<package name>`. For example:
- `npm run test:core` - Test core package
- `npm run test:store` - Test store package
- `npm run test:cloud-foundry` - Test Cloud Foundry package

To run tests in watch mode: `npm run test:watch`

### End-to-end tests

Run `npm run e2e` to execute the end-to-end tests via [Playwright](https://playwright.dev/).

Additional E2E commands:
- `npm run e2e:dev` - Run tests against local instance on `https://127.0.0.1:4200`
- `npm run e2e:ui` - Run tests with Playwright UI mode
- `npm run e2e:debug` - Run tests in debug mode
- `npm run e2e:headed` - Run tests in headed mode (see browser)
- `npm run e2e:report` - View test report

More information on the E2E tests and pre-requisites for running them is available here - [E2E Tests](developers-guide-e2e-tests.md).

### Code Climate

We use [Code Climate](https://codeclimate.com/github/cloudfoundry-incubator/stratos) to check for general code quality issues. This executes against Pull
Requests on creation/push.

#### Running Code Climate locally
> Generally we would not advise doing this and just rely on the code climate gate to run when pull requests are submitted

To run locally see instructions [here](https://github.com/codeclimate/codeclimate) to install Code Climate CLI
and engine via docker. Once set ensure you're in the root of the project and execute the following (it may take a while)

```
codeclimate analyze
```

> **NOTE** Unfortunately this highlights all current issues and not those that are the diff between any master and feature branch. Analyze
can be ran against a single/sub set of files, again with all current issues, but a little more digestible.

```
codeclimate analyze <path to file/s>
```

In a feature branch to compare files that have changed to master, for instance, use the following

```
git checkout feature-branch-A
codeclimate analyze $(git diff --name-only master)
```

You can also run the above command via npm

```
npm run climate
```

### Stratos Continue Integration
For each new pull request and any subsequent pushes to it the following actions are executed
- Code quality analysis via Code Climate - https://codeclimate.com/
- Jenkins CI run, covering..
  - Frontend lint check
  - Backend lint check
  - Frontend unit tests
  - Backend unit tests
  - End to end tests
- Security anaylsis via Snyk - https://snyk.io/
