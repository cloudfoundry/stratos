# Deploying with Docker Compose

The following guide details how to deploy the Straos UI Console in a local docker environemtn using Docker Compose.

## Requirements:
This project depends on the following:

* [Docker](https://docs.docker.com/engine/installation/)
* [Docker Compose](https://docs.docker.com/compose/install/)

## Deploying

Open a command prompt and change directory to `deploy/docker-compose`:

```
cd deploy/docker-compose
```

Bring up the containers with:

```
docker-compose up -d
```

Wait until all of the containers have finished coming up.

The Console UI should now be accessible at the following URL:

https://localhost

> Note: If you already have a local service running on port 443, you will need to modify the `docker-compose.yml` file to expose the console UI on a different port. To do so, find the `nginx` component and change the line:

'''
    - 443:443
```

changing the first `443` to the number of a unused port on your machine.

## Tearing down the deployment

You can stop and tear down the deployment, with:

```
docker-compose down
```