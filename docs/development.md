# Developing the Stratos UI Console

> **Note:** This document is work in progress.


The Stratos Console UI provides a single comprehensive and ubiquitous user 
experience for: discovering, composing, developing and managing Cloud Native 
workloads which are hosted in a myriad of: public, managed and private 
cloud/compute providers.

1. [Working on the front-end component](#working-on-the-front-end-component)
2. [Working on the back-end component](#working-on-the-backend-component)
3. [Testing](#testing)

## Components

The top-level repository contains three folders worth calling out:

Folder | Description
-------|------------
build | Contains build scripts (mainly gulp-based) for both the backend and frontend
components | Contains the source code for the Console
deploy | Contains scripts and artifacts for deploying the Console.

The Console code can be found in the [components](../components) folder. The following components are currently included:

Component Name | Description
---------------|------------
about-app | Provides an "about" view for the Console
app-core | Contains core functionality, such as login and navigation
app-framework | Providers a set of UI widgets and utilities
app-theme | Style information for the app-framework
cloud-foundry | All Cloud Foundry specific code
cloud-foundry-hosting | Specific component used for hosting the Console as an app in a single Cloud Foundry
endpoints-dashboard | Manage Console endpoints, specifically Cloud Foundry's. The inclusion allows additional Cloud Foundry endpoints to be added
suse-branding | Overrides styles to show the Console with SUSE branding

### Component architecture

Components can include both frontend and backend code. The source code for these sits together under a single component folder.

The Console Frontend is written using AngularJS and the backend written in Go.

The Console build determines the location of the frontend and backend code via a configuration file
named `[component name].component.json`.
When no frontend configuration is found in *.component.json it is assumed the component is purely for the frontend and that its source
code sites directly in the component folder, father than a `frontend` subfolder.

### Including your own components
Other components can be included to add additional items to the navigation bar and their associated content. This can include additional types of 'endpoints' (an existing endpoint for example is Cloud Foundry). Instructions on how to carry out this will be added at a later date.

## Working on the front end component

### Source Code Structure

The frontend code is split into component directories as listed above. 
The standard set of components that exist in the console contain functionality 
to manage Cloud Foundry instances and their applications.

The frontend code is usually found within a `frontend` folder and contains 
a structure such as that in app-core/frontend component, for example:
```
|-- frontend
|   |-- assets     
|   |-- i18n
|   |   -- en
|   |-- src
|   |   |-- api
|   |   |-- model
|   |   |-- utils
|   |   |-- view
|   |-- test
|   `-- index.html
|-- app-core.component.json
`-- bower.json
```

Directory | Contains
----------|------------
assets | Any images required by the front end
i18n | Internationalization strings per locale. By default the console contains English (US)
src | Javascript, html and scss related to the component
test | Unit tests for the component

> **Note:** The bower.json is in the root of the component 

### Style Sheets
The frontend defines styles in SCSS which is converted to CSS at build time. 
Each component is responsible for specifying it's root scss as a 'main' file 
in it's bower.json. From this all other 
component scss are gathered.

### Build Process
The build process uses gulp, see the the root gulpfile.js. Below is a list 
of important gulp tasks.

Gulp task name | Description
----------|------------
clean | Removes the dist folder
dev | Executes a developer build and serves the console via browser sync
run | Executes a production build and serves the console via express
lint | Executes linting via eslint. See ./.eslintrc for rules

> **Note:** When using the `dev` task, web sockets do not get forwarded, so log streaming and ssh access will not work - use the `run` task to test these.

Some tasks can be accessed via npm, by running `npm script target` along with additional test 
functionality:

NPM script name | Description
----------------|------------
lint | Same as gulp lint
coverage | Executes both unit and e2e tests and provides a combined coverage report in `./out/coverage-report`
gate-check | Executes lint and unit tests, very handy to use before creating a PR 
e2e | Executes end to end tests via protractor, also handy to use before creating a PR. Screenshots of the console for each failure can be found in ./out/e2e-failures
test | Executes unit tests


### Run the frontend via gulp

#### Requirements
The Console backend must be up and contactable by the developers machine. 
This can be achieved via any of the methods 
described in the [deploy](../deploy/README.md) instructions.

#### Configuration
The Console frontend must know the address of the backend. This can be 
set by creating the file ./build/dev_config.js 
with contents such as
```
{
  "pp": "<console address>/pp"
}
```

For example, if the console was deployed and accessible via `https://localhost`

the following configuration should be used
```
{
  "pp": "https://localhost/pp"
}
```

#### Run
To run the frontend with bits as if it were production (uses minified resources) execute ...
```
$ gulp run
```

To run the frontend in development mode (uses non-minified resources and serves via browsersync) execute ...
```
$ gulp dev
```

In both cases the console should be available via https://localhost:3100

> **Note:** If you see the following error when running 'gulp dev' you may need to increase your OS ulimit.
```
Error: ENFILE: file table overflow, scandir <snip>;
    at Error (native)
-bash: /dev/null: Too many open files in system
```

### Linting
We use eslint to executing linting. To run these execute...
```
$ gulp lint
```


### Creating a successful Pull Request in github
For every new pull request, or commit to an existing request, the CI will 
run a build against the requests HEAD. Before creating a PR or pushing to 
one please ensure the following two requests execute successfully

```
$ npm run gate-check
```
(lint + unit tests)

```
$ npm run e2e
```
(e2e tests)

## Working on the backend component

### Getting started

The portal-proxy is the back-end for the Console UI. It is written in Go.

#### Set a GOPATH

#### Clone the project

#### Dependency Management (Glide)

#### Set environment variables

#### Set up developer certs

#### Tests

##### Unit Testing

#### Running portal-proxy in a container

#### Running "like a dev"

#### Running "like production"

##### Run the build

##### Run the server

## Testing

### Front End Unit Tests
Unit test are written via jasmine and executed in karma. To run these execute...
```
$ npm test
```

### End to End Tests
To run e2e tests a cloud foundry with specific orgs, spaces and users is required.

To set this up
1. Ensure the cf cli tool is installed. See https://github.com/cloudfoundry/cli
2. cf tool has targeted the cf instance and logged in (cf api, cf login)
3. Execute the following script to set up the SUSE org, dev space and e2e user

**NOTE** This will also create an application which will continually output log statements. This will be used to test
 the log reader.
```
$ ./test/e2e/config-cf.sh
```
4. Copy ./build/secrets.json.sample to ./build/secrets.json and update cloudFoundry url and cf admin username/password
5. Execute the tests via...
```
$ npm run e2e
```

#### Continuous Integration

Pull request submitted to the stratos-ui project will run through 
frontend unit tests, backend unit tests and integration tests. The 
concourse server which executes these is currently not available 
externally. The result however can still be seen by the usual 
indications posted by github to the PR's page.
