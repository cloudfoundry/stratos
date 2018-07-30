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

> Note: If you are using Docker for Macand you get an error 137 when building, you should increase the memory available to Docker (via Preferences > Advanced) and try again.

Bring up the container with:

```
docker run -p 4443:443 stratos-aio
```

Stratos should now be accessible at the following URL:

https://localhost:4443

You will be presented with the Stratos Setup welcome screen - you will need to enter your UAA information to configure Stratos. Once complete, you will be able to login with your credentials.
