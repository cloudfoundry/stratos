
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

* Set up a Stratos backend - The frontend cannot run without a backend. Both backend and frontend exist in this same repo.
  * Don't need to make changes to the backend code? To set up a backend run through the [deploy section](https://github.com/cloudfoundry/stratos/blob/master/deploy/README.md),
    choose a deployment method and bring one up. These deployments will bring up the entire backend, including api service and database
    along with a V2 frontend.
  * Need to make changes to the backend code? Follow the below [Backend Development](#Backend-Development) set up guide
* Install [NodeJs](https://nodejs.org) (minimum node version 12.13.0)
* Install [Angular CLI](https://cli.angular.io/) - `npm install -g @angular/cli`

### Configuration

Configuration information can be found in two places

* `./proxy.conf.js`
  * In new forks this is missing and needs to be created using `./proxy.conf.template.js` as a template.
  * Contains the address of the backend. Which will either be...
     * If the backend is deployed via the instructions in the [deploy section](https://github.com/cloudfoundry/stratos/blob/master/deploy/README.md)
       the url will be the same address as the V1 console's frontend address. For instance `https://localhost` would translate to
        ```
        const PROXY_CONFIG = {
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
      * If the backend is running locally using the instructions [Backend Development](#Backend-Development) below the url will local host
        with a port of the `CONSOLE_PROXY_TLS_ADDRESS` value from `src/jetstream/config.properties`. By default this will be 5445. For
        instance
        ```
        const PROXY_CONFIG = {
          "/pp": {
            "target": {
              "host": "localhost",
              "protocol": "https:",
              "port": 5443
            },
            "ws": true,
            "secure": false,
            "changeOrigin": true,
          }
        }
        ```
* `./src/frontend/environments/environment.ts` for developer vs production like config
  * This contains more general settings for the frontend and does not usually need to be changed

## Run the frontend

1. (First time only) Copy `./proxy.conf.template.js` to `./proxy.conf.js` and update with required Jetstream url (see above for more info)
1. Run `npm install`
1. Run `npm start` for a dev server. (the app will automatically reload if you change any of the source files)
   * If this times out please use `npm run start-high-mem` instead
   * To change the port from the default 4200, add `-- --port [new port number]`
   * To stop the automatic reload every time a resource changes add `-- --live-reload false`
   * To do both the above use `-- --live-reload false --port [new port number]`
1. Navigate to `https://localhost:4200/`. The credentials to log in will be dependent on the Jetstream the console points at. Please refer
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

## Backend Development

Jetstream is the back-end for Stratos. It is written in Go.

We use Go Modules for dependency management.

### Pre-requisites

You will need the following installed/available:

* go 1.12 or later.

*For authentication, **either***

* A UAA instance
* A local user account 

### Building the back-end


#### Build

From the `src/jetstream` folder, build the Stratos back-end with:

```
npm run build-backend
```

The back-end executable is named `jetstream` and should be created within the `src/jetstream` folder.

### Configuration

Configuration can either be done via
- Environment Variable and/or Config File
- In the UI when you first use a front end with this backend

In all cases the configuration is saved to the database on first run. Any subsequent changes require the db to be reset. For the default sqlite
db provider this can be done by deleting `src/jetstream/console-database.db`

#### Configure by Environment Variables and/or Config File

By default, the configuration in file `src/jetstream/config.properties` will be used. These can be changed by environment variables
or an overrides file.

##### Environment variable

If you wish to use a local user account, ensure you have set the following environment variables:

- `AUTH_ENDPOINT_TYPE=local`
- `LOCAL_USER` - The username for the local user
- `LOCAL_USER_PASSWORD` - The password for the local user
- `LOCAL_USER_SCOPE=stratos.admin` - This gives the local user admin permissions. Currently other roles are not available.

If you have a custom uaa, ensure you have set the following environment variables:

- `UAA_ENDPOINT`- the URL of your UAA
  - If you have an existing CF and want to use the same UAA use the `authorization_endpoint` value from `[cf url]/v2/info`
    For example for PCF Dev, use: `UAA_ENDPOINT=https://login.local.pcfdev.io`.
- `CONSOLE_CLIENT` - the Client ID to use when authenticating against your UAA (defaults to: 'cf')
- `CONSOLE_CLIENT_SECRET` - the Client ID to use when authenticating against your UAA (defaults to empty)
- `CONSOLE_ADMIN_SCOPE` - an existing UAA scope that will be used to identify users as `Stratos Admins`

> To use a pre-built Stratos UAA container execute `docker run --name=uaa --rm -p 8080:8080 -P splatform/stratos-uaa`. The UAA will be
  available at `http://localhost:8080` with a `CONSOLE_CLIENT` value of `console`

##### Config File

To easily persist configuration settings copy `src/jetstream/config.example` to `src/jetstream/config.properties`. The backend will load its
configuration from this file in preference to the default config file, if it exists. You can also modify individual configuration settings
by setting the corresponding environment variable.

##### To configure a local user account via config file

In `src/jetstream/config.properties` uncomment the following lines:

```
AUTH_ENDPOINT_TYPE=local
LOCAL_USER=localuser
LOCAL_USER_PASSWORD=localuserpass
LOCAL_USER_SCOPE=stratos.admin
```

Load the Stratos UI and proceed to log in using the configured credentials.

#### To configure UAA via Stratos

1. Go through the `Config File` step above and comment out the `UAA_ENDPOINT` with a `#` in the new `config.properties` file.
1. If any previous configuration attempt has been made reset your database as described above.
1. Continue these steps from [Run](#run).
   - You should see the line `Will add setup route and middleware` in the logs
1. Load the Stratos UI as usual and you should be immediately directed to the setup wizard

The setup wizard that allows you to enter the values normally fetched from environment variables or files. The UI will assist you through
this process, validating that the UAA address and credentials are correct. It will also provide a list of possible scopes for the Stratos Admin

#### Run

Execute the following file from `src/jetstream`

```
jetstream
```

You should see the log as the backend starts up. You can press CTRL+C to stop the backend.


#### Automatically register and connect to an existing endpoint
To automatically register a Cloud Foundry add the environment variable/config setting below:

```
AUTO_REG_CF_URL=<api url of cf>
```

Jetstream will then attempt to auto-connect to it with the credentials supplied when logging into Stratos.

#### Running Jetstream in a container

We recommend running Stratos using the Docker All-In-One image.

* Follow instructions in the deploy/all-in-one docs

