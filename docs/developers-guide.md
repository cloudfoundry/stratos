
# Developing the Stratos Console

1. [Frontend Development](#frontend-development)
1. [Backend Development](#backend-development)

## Frontend Development

### Setup/Install Dependencies

* Setup Stratos backend - The frontend cannot run without a backend. The Stratos backend is still to be ported over from
  [V1](https://github.com/SUSE/stratos-ui), so head on over to the
  [deploy section](https://github.com/SUSE/stratos-ui/blob/master/deploy/README.md), choose a deployment method and bring one up. These will
  bring up the entire backend, including api service and database along with V1 of the frontend.
* Install [NodeJs](https://nodejs.org) (mininum version v8.6.0)
* Install [Angular CLI](https://cli.angular.io/) - `npm install -g @angular/cli`

## Configuration

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

1. (First time only) Copy `./proxy.conf.templage.js` to `./proxy.conf.js` and update with required portal-proxy url (see above for more info)
1. Run `npm install`
1. Run `npm start` for a dev server.
1. Navigate to `https://localhost:4200/`. The credentials to log in will be dependent on the portal-proxy the console points at. Please refer
   to the guides used when setting up. the portal-proxy for more information

The app will automatically reload if you change any of the source files.

## Creating angular items via angular cli

Run `ng generate component component-name` to generate a new component. You can also use `ng generate <directive|pipe|service|class|guard|interface|enum|module> <name>`.

## Build

Run `npm huild` to build the project.

The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

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

## Backend Development

The backend (more informally called the portal-proxy or 'pp' for short) is still to be ported over from V1 of
[Stratos](https://github.com/SUSE/stratos-ui). Once that's completed come back and check out this section for instructions on how to
make changes to it.
