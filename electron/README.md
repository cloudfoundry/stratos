# Stratos Desktop

Stratos Desktop packages Stratos into a Desktop application using the Electron framework.

## Quick Start

From the top-level folder, run:

```
cd electron
./package.sh
```

This will:

- Install the npm dependencies for Stratos and the Electron App if needed
- Build the Stratos frontend and backend if needed
- Package the Stratos frontend and backend together with the Electron app

On a fresh checkout, this will take some time to run - at the end you'll see some log messages indicating where the packaged outputs have been written.

For Mac OS, you'll get `.app` and `.dmg` files created. The `.app` file can be opened from a terminal with the `open` command.

> Note, the Stratos back-end is written in go and currently we only build for the current architecture that you are running on - it should be possible with some extra scripts to build
the desktop application for Mac, Windows and Linux in one-go.

For more information on other scripts you can run for different build/dev scenarios, so below.

## Overview

This section provides a short overview on what goes on when Stratos runs as a desktop application.

Stratos consists of a go backend and an Angular front-end. The Angular frontend is compiled into a set of static files. The go back-end serves up the static files in addition to providing the backend API for Stratos. The frontend resources reside in the `dist` folder.

For the desktop build, we build the Stratos backend including an extra plugin `desktop` (in `src/jetstream/plugins/desktop`). This adds support for endpoints from local configuration. The frontend is also build including the additional `desktop-extensions` extension (in `src/frontend/packages/desltop-extensions`). This extension also includes a slightly modified theme and some small UI tweaks for the desktop use-case.

The Electron wrapper is in the `electron` folder - the main file being the `index.js` file. Some of the things this does:

- Finds a free port and runs the go backend, listening on that port
- Creates a window and loads the UI from the backend
- Sets up file watchers on the local config files that are read for local endpoint information and sends a notification to the Stratos app when these are changed, so that it can update the endpoints

## Scripts

From the `electron` folder:


To run the Desktop application:

- `./run.sh all` - This will build both the backend and frontend and then run the app
- `./run.sh fe`  - This will build frontend and then run the app
- `./run.sh be` - This will build the backend and then run the app

> Note: You can also use `all` and `fe` and `be` with the `build.sh` script - when run without any arg, the build script will only build the frontend and backend if they have not previously been built


## Frontend Development

You can run the frontend in development mode, from the top-level folder with `ng serve` just as you would normally.

You can then run the desktop application using:

`./run.sh dev`

This will start the backend and launch the Electron application - but it will load the UI from `https://127.0.0.1:4200` rather than from the built version that the backend serves.

This allows you to make changes to the frontend code and have the application refresh within the webview, just as it would for regular development.

## Packaging

Electron Forge is used for packaging.