---
id: all-in-one
title: Deploying with the All-In-One Docker Container
sidebar_label: Docker All-in-One
---

The all-in-one container sets up the Stratos components in a single container.

## Requirements:

You will need to have installed Docker, see [Docker Installation Documentation](https://docs.docker.com/engine/installation/).

## Quick Start

Run Stratos in Docker locally:

```
$ docker run -p 5443:5443 splatform/stratos:stable 
```

Once that has finished, you can then access Stratos by visiting [https://localhost:5443](https://localhost:5443).

You can configure a local admin account and set the password for future logins.

## Note regarding the Stratos Session Store Secret

Stratos uses a secret to protect the Session cookie it uses to identify users. By default it will generate a random value for this secret.

We recommend configuring an alphanumeric secret of your choice by setting the `SESSION_STORE_SECRET` environment variable.

This can be done by adding the following to the docker run command shown in the section below:

```
-e SESSION_STORE_SECRET=<alphanumeric secret>
```
## Configuring a local user account in place of a UAA

By default the All-in-one image requires a UAA for user authentication. If this is not desired, the image can be configured to use a Stratos local user account. Edit the file ```deploy/all-in-one/config.all-in-one.properties``` and uncomment the following lines before building the container.

```
#AUTH_ENDPOINT_TYPE=local
#LOCAL_USER=localuser
#LOCAL_USER_PASSWORD=localuserpass
#LOCAL_USER_SCOPE=stratos.admin
```

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
docker run -p 5443:5443 stratos-aio
```

Stratos should now be accessible at the following URL:

https://localhost:5443

If using a UAA, you will be presented with the Stratos Setup welcome screen - you will need to enter your UAA information to configure Stratos. Once complete, you will be able to login with your credentials. If you have configured the container to use a local user account instead of a UAA, log in with the credentials specified in the configuration file.

## Persisting the Database

Each time you start and stop the Docker All-In-One container, you will lose any your UAA configuration, endpoints and connections that you have made in Stratos.

In order to persist the Stratos database file between runs of the Docker container you can store the database file outside of the docker container.

Create a folder where the database folder will be stored, e.g.

```
mkdir -p ~/stratos-db
```

When starting the Docker container, mount a volume for this folder and pass this via the `SQLITE_DB_DIR` environment variable, e.g.

```
docker run -p 54443:5443 -v ~/stratos-db:/var/stratos-db -e SQLITE_DB_DIR=/var/stratos-db stratos-aio
```

Now each time you stop and start the container, Stratos will maintain the database file.

> Note: You can validate that the environment variable has been correctly set and check the database file location by observing the log file
of the Docker container. You should see a log message similar to: `SQLite Database file: /var/stratos-db/console-database.db`

## Pushing the All-In-One Docker Image to Cloud Foundry

> Note: We recommend setting the session store secret - please use a manifest file for this and set the `SESSION_STORE_SECRET` environment variable.

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
