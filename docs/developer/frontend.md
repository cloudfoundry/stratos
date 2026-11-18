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

If you feel comfortable with these and are happy with your dev environment please skip straight to
[Set up Dependencies](#set-up-dependencies).

## Set up Dependencies

* Set up a Stratos backend. Both backend and frontend exist in this same repo. Follow the [Backend Development](./introduction.md#build--run-locally) set up guide.
* Install Node.js and Bun at the versions in [Required Runtimes](../developer-environment.md#required-runtimes). The Angular CLI comes with the project's dependencies; run it as `bunx ng`.


## Run the frontend

1. Run `make install`
1. Run `make dev frontend` for a dev server. The app reloads automatically when you change a source file.
   * To change the ports, set `FRONTEND_PORT`, and `BACKEND_PORT` if the backend is not on 5443, for example
     `make dev frontend FRONTEND_PORT=5540 BACKEND_PORT=5543`
1. Navigate to `https://localhost:5440/`. The credentials to log in will be dependent on the Jetstream the console points at. Please refer
   to the guides used when setting up the backend for more information

## Build

> The normal dev cycle does not require a direct build.

Run `make build frontend` to build the frontend.

The build artefacts will be stored in `dist/frontend/browser/`. This is a production build of the application.

## Creating angular items via angular cli

To create a new angular component run `bunx ng generate component component-name`. You can use a similar command to create other types of angular
items `bunx ng generate <directive|pipe|service|class|guard|interface|enum> <name>`.

## Theming

Stratos does not use Angular Material. Colours and other design tokens are CSS custom properties exposed to templates as Tailwind v4 classes. See
[Theming Architecture](../theming-architecture.md) and [Tailwind CSS v4 Usage](../tailwind-usage.md) before styling new components.


## Additional Information

### Extensions

Documentation on extensions can be found [here](../extensions/introduction.md). From a developer's perspective extensions are packages.
The default set are in `./src/frontend/packages`, any package added directly here will be automatically included by the build.

At build time the Stratos Devkit (`./src/frontend/packages/devkit`) ensures all packages are imported correctly.
The devkit is built automatically by the `postinstall` step of `bun install` (which `make install` runs). To build it directly, run `bun run dev-setup`.

### Configuration

Configuration information can be found in two places

* `./proxy.conf.js`
  * Informs the frontend where the backend is
* `./src/frontend/packages/core/src/environments/environment.ts` for developer vs production like config
  * This contains more general settings for the frontend and does not usually need to be changed
* `config.properties`
  * Backend configuration
