# stratos-ui

## Pre-requisite
* Create a Docker machine. If running on OSX and VirtualBox, you may need to set the `--virtualbox-cpu-count` flag.
```
docker-machine create --driver virtualbox --virtualbox-cpu-count "2" default
eval $(docker-machine env default)
```
* Create and start [stratos-server](https://github.com/hpcloud/stratos-server).


## Build Docker image
```
docker build -t stratos-ui .
```

## Create and start Docker container
```
docker run -it --rm --name stratos-ui -v $(pwd):/usr/src/app -v $(pwd)/../helion-ui-framework:/usr/src/helion-ui-framework -v $(pwd)/../helion-ui-theme:/usr/src/helion-ui-theme stratos-ui /bin/bash

$ bash provision.sh
```
Once the script has finished, you'll be able to view the application at the IP of your Docker machine:
```
docker-machine ip default
```


## Create and start Docker container with Gulp watch
This will take a few minutes to provision. Any changes to source Javascript, SCSS or HTML files will automatically update the 'dist' folder. Be sure to stop the container before switching branches.
```
docker run -d --name stratos-ui -v $(pwd):/usr/src/app -v $(pwd)/../helion-ui-framework:/usr/src/helion-ui-framework -v $(pwd)/../helion-ui-theme:/usr/src/helion-ui-theme stratos-ui

# Show log and see provisioning status
docker logs stratos-ui
```


## SSH into the running container
```
docker exec -it stratos-ui /bin/bash
```

## Running Karma tests
```
$ cd tools
$ npm test
```

## Running Protractor tests
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

## Running ESLint
```
$ cd tools
$ ./node_modules/.bin/gulp lint
```