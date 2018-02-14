# Deploying with the All-In-One Docker Container

The all-in-one container sets up the Stratos components in a single container.

## Requirements:

You will need to have installed Docker, see:

* [Docker](https://docs.docker.com/engine/installation/)

## Building the container:

To build the container, change directory to the root of the project and open a command prompt:

```
docker build -f deploy/Dockerfile.all-in-one . -t stratos
```

Bring up the container with:

```
docker run -p 4443:443 stratos
```

Stratos should now be accessible at the following URL:

https://localhost:4443

To login use the following credentials detailed [here](../../docs/access.md).
