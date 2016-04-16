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

### Build and run the Stratos Identity Database
```
cd ../stratos-identity-db
docker-compose up -d

# Set up database
docker exec -it stratosidentitydb_db_1 /bin/bash
mysql -u stratos --password=stratos < /versions/0.0.1.sql
mysql -u stratos --password=stratos < /versions/add_some_data.sql
```

### Build and run the REST API server
```
cd ../stratos-node-server
docker build -t stratos-node-server .

# Run the mock authentication server
docker run -it --rm\
           --name mock-auth-service \
           -v $(pwd):/usr/src/app \
           -p 3001 \
           stratos-node-server

npm install && npm run start-mock-auth-server

# Run the mock API server
docker run -it --rm\
           --name mock-api-service \
           -v $(pwd):/usr/src/app \
           -p 3002 \
           stratos-node-server

npm install && npm run start-mock-api-server

docker run -it \
           --rm --name stratos-node-server \
           --link stratosidentitydb_db_1:db \
           --link mock-auth-service:auth_service \
           --link mock-api-service:cf_service \
           -v $(pwd):/usr/src/app \
           -p 3000:3000 \
           -e MYSQL_ROOT_PASSWORD=stratos \
           -e MYSQL_DATABASE=stratos-db \
           -e MYSQL_USER=stratos \
           -e MYSQL_PASSWORD=stratos \
           -e PORT=3000 \
           stratos-node-server

npm install && npm start
```

### Run Elasticsearch
```
cd ../stratos-es
docker build -t stratos-es .
docker run -d --name stratos-es stratos-es
```

### Build and run Nginx
Wait for the REST API server and Elasticsearch to be up and running before running the following commands:
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
