# Developing for Stratos UI

In this section, we describe how to set up your local development environment so that you are able to run through the application end-to-end. 

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






TODO:
---

Please ensure you have the following installed:
* Docker
* Vagrant
* VMWare Fusion or Workstation
* vagrant-reload plugin
* vagrant-vmware-fusion plugin (or vagrant-vmware-workstation) - **you will need to purchase a license**
* VirtualBox (optional)

### <a id="running-ui"></a>5. Running the Console UI
* Clone all related repositories
  - If starting from a fresh install, run: `sh start_fresh.sh`. This will clone all necessary repositories.
  - Otherwise, manually clone the following repositories:
    - stratos-ui
* [Create a Docker machine](create_docker_machine.md)
  - To keep using VirtualBox, you can run these commands:
    - `docker-machine create --driver virtualbox`
    - `eval $(docker-machine env default)`
* Determine and set the UAA endpoint:
  - `curl -Ss http://192.168.200.2:8080/api/v1/namespaces/hcp/services/ident-api | jq '.spec.ports[0].nodePort'`
  - In `development.rc`, uncomment the `Local HCP Identity for development` variables and set the following variable:
    - `HCP_IDENTITY_PORT=<IDENT-API-PORT>`
* You now have two options for running the Console:
  1. Use the `stand-up-dev-env.sh` script. For a clean start, run the script with the `-c` flag.
  2. Run the `docker-compose` commands manually. See below for [instructions](#running-ui-manually).
* Get the Docker machine IP: `docker-machine ip default`
* The Console UI should be available at the IP address returned above.
* The HCP UAA endpoint provides two users: `admin@cnap.local` and `user@cnap.local`. You can log into the Console UI with those users. Please ask the HCP team or Console UI team for passwords.

#### <a id="running-ui-manually"></a>Option 2: Run Docker Compose manually ####
* Generate portal-proxy binary. Follow the directions in the repository's [README](https://github.com/hpcloud/portal-proxy):
  - `cd $GOPATH/src/github.com/hpcloud/portal-proxy`
  - Install dependencies
  - Set environmental variables
  - Set up developer certs
  - `./tools/build_portal_proxy.sh`
* Back in stratos-deploy, build and run:
```
docker-compose -f docker-compose.development.yml build
docker-compose -f docker-compose.development.yml up -d
docker logs -f stratosdeploy_ui_1
```
