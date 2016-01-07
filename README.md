# stratos-ui

## Build docker image
```
docker build -t stratos-ui .
```

## Create and start docker container
```
docker run -it --rm --name stratos-ui -v $(pwd):/usr/src/app -v $(pwd)/../helion-ui-framework:/usr/src/helion-ui-framework stratos-ui /bin/bash
```

## provision container
```
docker exec -d stratos-ui /bin/bash provision.sh
```

## ssh into the running container
```
docker exec -it stratos-ui /bin/bash
```
