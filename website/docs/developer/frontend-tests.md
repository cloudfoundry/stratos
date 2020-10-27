---
title: Frontend Tests
sidebar_label: Tests
---

## Test

### Lint

Run `npm run lint` to execute tslint lint checking.

### Unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io). Coverage information can be found in `./coverage`

To execute an individual package run `ng test <package name>`. To execute the tests again automatically on code changes add `--watch=true`

> **NOTE** npm test will search for chrome on your path. If this is not so please set an env var CHROME_BIN pointing to your executable
(chromium is fine too).

### End-to-end tests

Run `npm run e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

Run `npm run e2e-dev` to execute end-to-end tests against a locally running instance on `https://localhost:4200`

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
