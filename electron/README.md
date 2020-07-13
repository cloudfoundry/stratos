# Stratos Desktop

From the top-level Stratos folder:

- Install dependencies with `npm install`
- Change to the `electron folder` with `cd electron`
- Install dependencies for the electron UI with `npm install`
- Run the Electron app with `./run.sh all`

> Note this builds both the frontend and backend and run the app

- To build only the front end before running, use `./run.sh fe`
- To build only the back end before running, use `./run.sh be`
- To run without building either the the back end or front end, use `./run.sh`


You can also run the UI with `ng serve` from the top-level folder and then start electron with:

`./run.sh dev`

to load the UI from `https://127.0.0.1:4200`