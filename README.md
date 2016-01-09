# stratos-ui

## Pre-requisite
If running on OSX and VirtualBox, you will likely need to create a Docker machine with the `--virtualbox-cpu-count=2` flag.
```
docker-machine create --driver virtualbox --virtualbox-cpu-count=2 default
```

## Build Docker image
```
docker build -t stratos-ui .
```

## Create and start Docker container
```
docker run -it --rm --name stratos-ui -v $(pwd):/usr/src/app -v $(pwd)/../helion-ui-framework:/usr/src/helion-ui-framework -v $(pwd)/../helion-ui-theme:/usr/src/helion-ui-theme stratos-ui /bin/bash

$ bash provision.sh
```

## Create and start Docker container with Gulp watch
```
docker run -d --name stratos-ui -v $(pwd):/usr/src/app -v $(pwd)/../helion-ui-framework:/usr/src/helion-ui-framework -v $(pwd)/../helion-ui-theme:/usr/src/helion-ui-theme stratos-ui
```

## Provision container
```
docker exec -d stratos-ui /bin/bash provision.sh
```

## SSH into the running container
```
docker exec -it stratos-ui /bin/bash
```

## Running Karma tests
```
$ cd tools
$ ./node_modules/karma/bin/karma start
```

## Running Protractor tests
Start the Selenium server:
```
$ cd tools
$ ./node_modules/protractor/bin/webdriver-manager update
$ ./node_modules/protractor/bin/webdriver-manager start
```

Open another terminal and run Protractor. You'll need to run 'eval' again for your Docker machine (replace 'default' with your machine name).
```
eval "$(docker-machine env default)"
docker exec -it stratos-ui /bin/bash

$ ./node_modules/protractor/bin/protractor protractor.conf.js
```