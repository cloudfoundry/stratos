# Deploying with the All-In-One Docker Container

The All-in-One container sets up the Stratos Console components in a single container.

## Requirements:

You will need to have installed Docker, see:

* [Docker](https://docs.docker.com/engine/installation/)

## Building the container:

To build the container, change directory to the root of the project and open a command prompt:

```
docker build -f deploy/Dockerfile.all-in-one . -t stratos-ui
```

Bring up the container with:

```
docker run -p 4443:443 stratos-ui
```

The Console UI should now be accessible at the following URL:

https://localhost:4443

To login use the following credentials detailed [here](../../docs/access.md).
