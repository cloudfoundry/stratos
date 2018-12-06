# Deploying with the All-In-One Docker Container

The all-in-one container sets up the Stratos components in a single container.

## Requirements:

You will need to have installed Docker, see:

* [Docker](https://docs.docker.com/engine/installation/)

## Building the container:

To build the container, change directory to the root of the project and open a command prompt:

```
build/store-git-metadata.sh
docker build -f deploy/Dockerfile.all-in-one . -t stratos-aio
```

> Note: The Dockerfile for all-in-one is in the `deploy` folder and not the `deploy/all-in-one` folder.

> Note: If you are using Docker for Mac and you get an error 137 when building, you should increase the memory available to Docker (via Preferences > Advanced) and try again.

Bring up the container with:

```
docker run -p 4443:443 stratos-aio
```

Stratos should now be accessible at the following URL:

https://localhost:4443

You will be presented with the Stratos Setup welcome screen - you will need to enter your UAA information to configure Stratos. Once complete, you will be able to login with your credentials.

## Pushing the All-In-One Docker Image to Cloud Foundry

The All-In-One Docker Image can be pushed to Cloud Foundry.

Firstly, build the image and push it to a Docker registry, so that it is available to Cloud Foundry, e.g. to build and push to Docker Hub, in the project root directory run:

```
build/store-git-metadata.sh
docker build -f deploy/Dockerfile.all-in-one . -t MY-DOCKER-ORG/stratos-aio:latest
docker push MY-DOCKER-ORG/stratos-aio:latest
```

Where `MY-DOCKER_ORG` is your Docker Hub organization.

You can now push this image directly to Cloud Foundry with:

```
cf push stratos --docker-image MY-DOCKER-ORG/stratos-aio:latest
```

The log output of the push command will include the URL where the Stratos application can be accessed in a browser, e.g.

```
> cf push stratos --docker-image MY-DOCKER-ORG/stratos-aio:latest
Creating app stratos in org e2e / space e2e as admin...
OK

Creating route stratos.local.pcfdev.io...
OK

Binding stratos.local.pcfdev.io to stratos...
OK


Starting app stratos in org e2e / space e2e as admin...
Creating container
Successfully created container
Staging...
Staging process started ...
Staging process finished
Exit status 0
Staging Complete
Destroying container
Successfully destroyed container

1 of 1 instances running

App started


OK

App stratos was started using this command `./jetstream `

Showing health and status for app stratos in org e2e / space e2e as admin...
OK

requested state: started
instances: 1/1
usage: 256M x 1 instances
urls: stratos.local.pcfdev.io                  <-- URL
last uploaded: Mon Dec 3 03:12:47 UTC 2018
stack: cflinuxfs2
buildpack: unknown

     state     since                    cpu    memory      disk        details
#0   running   2018-12-03 03:12:54 AM   0.0%   0 of 256M   0 of 512M
```

> Note: In this example we are pushing with the application name `stratos`

> Note: By default the All-in-one image has SSL Validation disabled when authenticating with Cloud Foundry and the UAA - this allows it to work out of the box with environments like PCF Dev. If this is not the behavior you desire, edit the file `deploy/all-in-one/config.all-in-one.properties` and change the `SKIP_SSL_VALIDATION` as desired before building and publishing the image.