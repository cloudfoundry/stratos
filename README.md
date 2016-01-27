# Helion Stratos Console UI
The Helion Stratos Console UI is written in Javascript and uses Angular 1.4.x. It currently runs locally in a Docker container.

For more implementation details, please see the following pages:
* [Architecture](docs/architecture.md)
* [Plugins](docs/plugins.md)

## System Requirements
For development, Nginx is used to serve static files while Express is used to host the mock REST API backend. A third container hosting Elasticsearch will provide the cache component.

This project depends on the following:
* [Docker](https://docs.docker.com/mac)
* [NodeJS](https://nodejs.org)
* [stratos-node-server](https://github.com/hpcloud/stratos-node-server) - mock REST API Express server
* [stratos-server](https://github.com/hpcloud/stratos-server) - Nginx server
* [helion-ui-framework](https://github.com/hpcloud/helion-ui-framework) - reusable Angular-based UI components
* [helion-ui-theme](https://github.com/hpcloud/helion-ui-theme) - Helion branding, assets, styles, theme

## Installation
Before continuing, please install Docker and NodeJS. Then, clone the repositories listed above at the same level as this project.

### Create a Docker machine
```
docker-machine create --driver virtualbox default
eval $(docker-machine env default)
```
Note: If your builds are hanging at the 'Setting up ca-certificates-java' step, you may need to set the `--virtualbox-cpu-count` flag when creating a Docker machine.
```
docker-machine create --driver virtualbox --virtualbox-cpu-count "2" default
```

### Build and run the REST API server
```
cd ../stratos-node-server
docker build -t stratos-node-server .
docker run -it --rm --name stratos-node-server \
           -v $(pwd):/usr/src/app \
           -p 3000:3000 \
           stratos-node-server
npm install && npm start
```

### Run Elasticsearch
```
docker run --name stratos-es -d elasticsearch elasticsearch
```

### Build and run Nginx
```
cd ../stratos-server
docker build -t stratos-server .
cd ../stratos-ui
docker run --name stratos-server \
           -v $(pwd)/dist:/usr/share/nginx/html:ro \
           -d -p 80:80 \
           --link stratos-node-server:stratos-node-server \
           --link stratos-es:stratos-es \
           stratos-server
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
Once the script has finished, you'll be able to view the application at the IP of your Docker machine:
```
docker-machine ip default
```

Alternatively, you can run this UI with Gulp watch. Any changes to source Javascript, SCSS or HTML files will automatically update the 'dist' folder. Be sure to stop the container before switching branches. This will take a few minutes to provision.
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

### Running Karma tests in container
```
$ cd tools
$ npm test
```

### Running Protractor tests in container
Start the Selenium server:
```
$ cd tools
$ ./node_modules/.bin/webdriver-manager update
$ ./node_modules/.bin/webdriver-manager start
```

Open another terminal and run Protractor. You'll need to run 'eval' again for your Docker machine (replace 'default' with your machine name).
```
eval "$(docker-machine env default)"
docker exec -it stratos-ui /bin/bash

$ ./node_modules/.bin/protractor protractor.conf.js
```

### Running ESLint in container
```
$ cd tools
$ ./node_modules/.bin/gulp lint
```

### Generate documentation (experimental)
Locally, run the following command to generate documentation in the `docs/src` folder. You can then view the documentation by pointing your browser to the `index.html` file of that `docs/src` folder.
```
cd tools
./node_modules/.bin/jsdoc ../src/app ../src/*.js -r -d ../docs/src
```
