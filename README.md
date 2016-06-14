# Helion Stratos Console UI
The Helion Stratos Console UI is written in JavaScript and runs in a Docker container. It also uses Angular 1.4.x to maintain compability with Angular UI Bootstrap.

For more implementation details, please see the following pages:
* [Overview](docs/README.md)
* [Architecture](docs/architecture.md)
* [Plugins](docs/plugins.md)

## System Requirements
Nginx is used to serve static files while Node.js + Express is used to host the mock REST API backend (which is in development). Another container hosts the MySQL database for session and service instance management. Finally, there is a container hosting Elasticsearch that provides the cache component.

This project depends on the following:
* [Docker](https://docs.docker.com/mac)
* [Node.js](https://nodejs.org) - to easily install Node.js modules
* [stratos-identity-db](https://github.com/hpcloud/stratos-identity-db) - MySQL identity database
* [stratos-node-server](https://github.com/hpcloud/stratos-node-server) - mock REST API Express server
* [stratos-es](https://github.com/hpcloud/stratos-es) - Elasticsearch
* [stratos-server](https://github.com/hpcloud/stratos-server) - Nginx server
* [helion-ui-framework](https://github.com/hpcloud/helion-ui-framework) - reusable Angular-based UI components
* [helion-ui-theme](https://github.com/hpcloud/helion-ui-theme) - Helion branding, assets, styles, theme

## Installation
Before continuing, please install Docker and Node.js. Then, clone the repositories listed above at the same level as this project.

### Create a Docker machine
```
docker-machine create --driver virtualbox default
eval $(docker-machine env default)
```
Note: If your builds are hanging at the 'Setting up ca-certificates-java' step, you may need to set the `--virtualbox-cpu-count` flag when creating a Docker machine.
```
docker-machine create --driver virtualbox --virtualbox-cpu-count "2" default
```

### Build and run Helion Stratos Console UI
```
docker build -t stratos-ui .
docker run -it --rm --name stratos-ui \
           -v $(pwd):/usr/src/app \
           -v $(pwd)/../helion-ui-framework:/usr/src/helion-ui-framework \
           -v $(pwd)/../helion-ui-theme:/usr/src/helion-ui-theme \
           stratos-ui /bin/bash
bash provision.sh
```
Once the script has finished, you'll be able to view the application at the IP of your Docker machine. This is usually `192.168.99.100`. If you have multiple Docker machines, you can retrieve the IP of your Docker machine with the following command:
```
docker-machine ip [YOUR_DOCKER_MACHINE_NAME]
```

Alternatively, you can run this UI with Gulp watch. Any changes to source Javascript, SCSS or HTML files will automatically update the 'dist' folder. This will take a few minutes to provision.
```
docker run -d --name stratos-ui \
           -v $(pwd):/usr/src/app \
           -v $(pwd)/../helion-ui-framework:/usr/src/helion-ui-framework \
           -v $(pwd)/../helion-ui-theme:/usr/src/helion-ui-theme \
           stratos-ui

# Show log and see provisioning status
docker logs stratos-ui
```

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
$ xvfb-run --server-args='-screen 0 1280x1024x24' ./node_modules/.bin/protractor protractor.conf.js
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

#### Build and register image for UCP
**Docker Quickstart Terminal**
```
docker build -t 192.168.99.100:5000/cnap_nginx -f Dockerfile.ucp .
docker push 192.168.99.100:5000/cnap_nginx
```
