---
title: Frontend Development
sidebar_label: Overview
---

## Introduction to the stack

Have a look through the [Env + Tech](developers-guide-env-tech.md) page to get acquainted with some of the new technologies used in v2.
These include video's, tutorials and examples of Angular 2+, Typescript and Redux. There's also some advice on helpful plugins to use if
using Visual Studio Code. If you feel comfortable with these and are happy with your dev environment please skip straight to
[Set up Dependencies](#set-up-dependencies)

## Set up Dependencies

* Set up a Stratos backend - The frontend cannot run without a backend. Both backend and frontend exist in this same repo.
  * Don't need to make changes to the backend code? To set up a backend run through the [deploy section](../deploy/overview),
    choose a deployment method and bring one up. These deployments will bring up the entire backend, including api service and database
    along with a V2 frontend.
  * Need to make changes to the backend code? Follow the [Backend Development](backend) set up guide
* Install [NodeJs](https://nodejs.org) (minimum node version 12.13.0)
* Install [Angular CLI](https://cli.angular.io/) - `npm install -g @angular/cli`

## Configuration

Configuration information can be found in two places

* `./proxy.conf.js`
  * In new forks this is missing and needs to be created using `./proxy.conf.template.js` as a template.
  * Contains the address of the backend. Which will either be...
     * If the backend is deployed via the instructions in the [deploy section](../deploy/overview)
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
      * If the backend is running locally using the instructions in [Backend Development](backend), the url will local host
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
