---
title: Frontend Development
sidebar_label: Overview
---

## Introduction to the stack

Before making changes to the frontend code you should be familiar with

1. Angular
1. Typescript / ES6
1. Redux / NGRX / Observables
1. Node / NPM

There are a some introduction style resources [here](./developers-guide-env-tech.md). There's also some advice on helpful [VS code plugins](./developers-guide-env-tech#vs-code-plug-ins). If you feel comfortable with these and are happy with your dev environment please skip straight to
[Set up Dependencies](#set-up-dependencies).

## Set up Dependencies

* Set up a Stratos backend. Both backend and frontend exist in this same repo. Follow the [Backend Development](./introduction#build--run-locally) set up guide.
* Install [NodeJs](https://nodejs.org) (if not already install) (minimum node version 12.13.0)
* Install [Angular CLI](https://cli.angular.io/) (if not already install) - `npm install -g @angular/cli`


## Run the frontend

1. Run `npm install`
1. Run `npm start` for a dev server. (the app will automatically reload if you change any of the source files)
   * If this times out please use `npm run start-high-mem` instead
   * To change the port from the default 4200, add `-- --port [new port number]`
   * To stop the automatic reload every time a resource changes add `-- --live-reload false`
   * To do both the above use `-- --live-reload false --port [new port number]`
1. Navigate to `https://localhost:4200/`. The credentials to log in will be dependent on the Jetstream the console points at. Please refer
   to the guides used when setting up the backend for more information

## Build

> The normal dev cycle does not require a direct build.

Run `npm run build` to build the project.

The build artefacts will be stored in the `dist/` directory. This will output a production build of the application.

## Creating angular items via angular cli

To create a new angular component run `ng generate component component-name`. You can use a similar command to create other types of angular
items `ng generate <directive|pipe|service|class|guard|interface|enum|module> <name>`.

## Theming

We use the angular material theming mechanism. See [here](https://material.angular.io/guide/theming-your-components) for more information about theming new components added to stratos.


## Additional Information

### Extensions

Documentation on extensions can be found [here](../extensions/introduction). From a developers perspective extensions are managed by npm packages.
The default set are in `./src/frontend/packages`, any package added directly here will be automatically included by the build.

At build time the Stratos Devkit (`./src/frontend/packages/devkit`) will ensure all packages are imported correctly and theming, both component and console level, are applied correctly.
The devkit is automatically built in `postinstall` after `npm install` is ran. To directly build it `npm run dev-setup` can be executed.

### Configuration

Configuration information can be found in two places

* `./proxy.conf.js`
  * Informs the frontend where the backend is
* `./src/frontend/packages/core/src/environments/environment.ts` for developer vs production like config
  * This contains more general settings for the frontend and does not usually need to be changed
* `config.properties`
  * Backend configuration
