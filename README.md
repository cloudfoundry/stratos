> **NOTE** This is a WIP angular 2.x project and should not be distributed, reviewed, ran or prodded. It will eventually replace the
existing angular 1.x based stratos-ui project at [https://github.com/SUSE/stratos-ui](https://github.com/SUSE/stratos-ui)

# Stratos
Stratos UI is an Open Source Web-based UI (Console) for managing Cloud Foundry. It allows users and administrators to both manage
applications running in the Cloud Foundry cluster and perform cluster management tasks.

## Configuration
Configuration information can be found in two places (tech debt?) 
* `./proxy.conf.js` for portal-proxy config
* `./src/environments/environment.ts` for UAA config

## Development server
1. (First time only) Copy `./proxy.conf.templage.js` to `./proxy.conf.js` and update with required portal-proxy url
2. Run `npm start` for a dev server.
3. Navigate to `http://localhost:4200/`.

The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build
Run `npm huild` to build the project. 

The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io). Coverage information can be found in ./coverage

> **NOTE** npm test will search for chrome on your path. If this is not so please set an env var CHROME_BIN pointing to your executable (chromium is fine too).

## Running end-to-end tests

Run `npm run e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `npm start`.

