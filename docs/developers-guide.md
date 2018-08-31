
# Developing the Stratos Console

1. [Introduction](#introduction)
1. [Frontend Development](#frontend-development)
1. [Backend Development](#backend-development)

## Introduction

Stratos comprises of two main components:

- A front-end UI that runs in your web browser. This is written in [Typescript](https://www.typescriptlang.org/) and uses the [Angular](https://angular.io/) framework.
- A back-end that provides a web-based API to the front-end. This is written in Go.

Depending on what you are contributing, you will need to develop with the front-end, back-end or both.

## Frontend Development

### Introduction to the stack

Have a look through the [Env + Tech](developers-guide-env-tech.md) page to get acquainted with some of the new technologies used in v2.
These include video's, tutorials and examples of Angular 2+, Typescript and Redux. There's also some advice on helpful plugins to use if
using Visual Studio Code. If you feel comfortable with these and are happy with your dev environment please skip straight to
[Set up Dependencies](#set-up-dependencies)

### Set up Dependencies

* Set up a Stratos backend - The frontend cannot run without a backend. Both backend and frontend exist in this same repo. To set up a backend
  run through the [deploy section](https://github.com/cloudfoundry-incubator/stratos/blob/master/deploy/README.md), choose a deployment method and bring
  one up. These deployments will bring up the entire backend, including api service and database along with a V2 frontend.
* Install [NodeJs](https://nodejs.org) (mininum version v8.6.0)
* Install [Angular CLI](https://cli.angular.io/) - `npm install -g @angular/cli`

### Configuration

Configuration information can be found in two places

* `./proxy.conf.js`
  * In fresh environments this is missing and needs to be created using `./proxy.conf.templage.js` as a template.
  * Contains the address of the backend.
  * If the backend is deployed via the instructions above this will be the same address as the V1 console's frontend address. For instance
  `https://localhost` would translate to

    ```const PROXY_CONFIG = {
      "/pp": {
        "target": {
        "host": "localhost",
        "protocol": "https:",
        "port": 443
      },
      "secure": false,
      "changeOrigin": true,
      "ws": true,
    }
    ```

* `./src/frontend/environments/environment.ts` for UAA config
  * This contains more general settings for the frontend
  * By default we output every Redux action to the console. If this is too verbose for yourself, simply set `logEnableConsoleActions` to false

## Run the frontend

1. (First time only) Copy `./proxy.conf.template.js` to `./proxy.conf.js` and update with required Jet Stream url (see above for more info)
1. Run `npm install`
1. Run `npm start` for a dev server. (the app will automatically reload if you change any of the source files)
1. Navigate to `https://localhost:4200/`. The credentials to log in will be dependent on the Jet Stream the console points at. Please refer
   to the guides used when setting up the backend for more information

## Build

Run `npm run build` to build the project.

The build artefacts will be stored in the `dist/` directory. This will output a production build of the application.

## Creating angular items via angular cli

To create a new angular component run `ng generate component component-name`. You can use a similar command to create other types of angular
items `ng generate <directive|pipe|service|class|guard|interface|enum|module> <name>`.

## Theming

We use the angular material theming mechanism. See [here](https://material.angular.io/guide/theming-your-components) for more information about theming new components added to stratos.

## Test

### Lint

Run `npm run lint` to execute tslint lint checking.

### Code Climate

We use [Code Climate](https://codeclimate.com/github/SUSE/stratos) to check for general code quality issues. This executes against Pull
Requests on creation/push.


#### Running Code Climate locally
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

### Unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io). Coverage information can be found in ./coverage

> **NOTE** npm test will search for chrome on your path. If this is not so please set an env var CHROME_BIN pointing to your executable
(chromium is fine too).

### End-to-end tests

Run `npm run e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

More information on the E2E tests and pre-requisites for running them is available here - [E2E Tests](developers-guide-e2e-tests.md).

## Backend Development

Jetstream is the back-end for Stratos. It is written in Go.

We use [dep](https://golang.github.io/dep/) for dependency management.

### Pre-requisites

You will need the following installed/available:

* go 1.9 or later.
* dep
* UAA instance - you will need a UAA running for authentication

### Building the back-end

You will need to ensure that Stratos is cloned into a folder within your GOPATH that matches the Stratos package structure, i.e.

```
$GOPATH/src/github.com/cloudfoundry-incubator/stratos
```

From the stratos folder, ensure that dep has downloaded the required dependencies by running:

```
dep ensure -vendor-only -v
```

From the `src/jetstream` folder, build the Stratos back-end with:

```
go build
```

The back-end executable is named `jetstream` and should be created within the `src/jetstream` folder.

To run, ensure you have set the following environment variables:

`UAA_ENDPOINT` - the URL of your UAA (for example for PCF Dev, use: `UAA_ENDPOINT=https://login.local.pcfdev.io`)
`CONSOLE_CLIENT` - the Client ID to use when authenticating against your UAA (defaults to: 'cf')
`CONSOLE_CLIENT_SECRET` - the Client ID to use when authenticating against your UAA (defaults to empty)

then run:

```
jetstream
```

You should see the log as the backend starts up. You can press CTRL+C to stop the backend.

### Configuration

By default, the configuration in the file `src/jetstream/default.config.properties` will be used.

To modify the configuration, copy this file to `src/jetstream/config.properties` and edit this file. The backend will load its configuration from this file in preference to the default config file, if it exists. You can also modify individual configuration settings by setting the corresponding environment variable.

> **Note** The properties are saved to the database on first run. Any subsequent changes require the db to be reset. For the default sqlite db provider this can be done by deleting `src/jetstream/console-database.db` 

#### Automatically register and connect to an existing endpoint
To automatically register a Cloud Foundry add the environment variable/config setting below:

> **Note** On login, Stratos will also attempt to auto-connect to the Cloud Foundry using the username/password provided.

```
AUTO_REG_CF_URL=<api url of cf>
```

#### Running Jetstream in a container
* Follow instructions in the deploy/docker-compose docs
* To apply changes (build and update docker image) simply run `deploy/tools/restart_proxy.sh`
