# Stratos UI

Stratos UI is an Open Source Web-based console UI for managing Cloud Foundry. It allows users and administrators to both manage applications running in the Cloud Foundry cluster and perform cluster management tasks.

![Stratos UI Application view](docs/images/stratos-ui.png)

## Deploying Stratos UI

Stratos UI can be deployed in the following environments:

1. Cloud Foundry, as an application
1. Kubernetes, using a helm chart
1. Docker, using docker compose

## License

The work done has been licensed under Apache License 2.0. The license file can be found [here](LICENSE.MD).

---
## OLD DOCS TO BE REVIEWED
---

For more implementation details, please see the following pages:
* [Overview](docs/README.md)
* [Architecture](docs/architecture.md)
* [Plugins](docs/plugins.md)


## System Requirements
Nginx is used to serve static files while a Golang based REST API backend. Another container hosts the Postgres database for session and service instance management.

This project depends on the following:
* [Docker](https://docs.docker.com/mac)
* [Node.js](https://nodejs.org) - to easily install Node.js modules
* [portal-proxy](https://github.com/hpcloud/portal-proxy) - Golang based REST API

## Installation
Install Docker and clone the repositories listed above at the same level as this project.

### Build and run
See the README in the `stratos-deploy` repo for details on how to develop against the Console.

## Docker commands and development tools

### View Logs
```
docker logs stratos-ui
```

### SSH into the running container
```
docker exec -it stratos-ui /bin/bash
```
or, from the stratos-deploy project
```
docker-compose run --rm ui bash
```

### Running Karma tests in container
```
$ cd tools
$ npm test
```

### Running Protractor tests in container
```
$ cd tools
$ npm run update-webdriver
$ npm run e2e
```
By default tests will execute against the local machine's ip address. To run against, for example, the gulp dev instance use
```
$ npm run e2e -- --params.host=localhost --params.port=3100
```

### Running ESLint in container
```
$ cd tools
$ ./node_modules/.bin/gulp lint
```

### Running gate check script
This runs the unit tests and linting.
```
$ cd tools
$ npm run gate-check
```

### Generate documentation (experimental)
Locally, run the following command to generate documentation in the `docs/src` folder. You can then view the documentation by pointing your browser to the `index.html` file of that `docs/src` folder.
```
cd tools 
./node_modules/.bin/jsdoc ../src/app ../src/*.js -r -d ../docs/src
```
