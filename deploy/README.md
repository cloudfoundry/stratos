# Stratos UI Console Deploy

The Stratos UI can be deployed in a number of ways
## Deploy as a Cloud Foundry application
See the 'Quick Start' section in the root [README](../README.md)
## Deploy in Kubernetes using a helm chart
See [Deploy Console in Kubernetes using Minikube and Helm](kubernetes/README.md)
## Deploy locally via Docker Compose


### Requirements:
This project depends on the following:

* [Docker](https://docs.docker.com/engine/installation/)
* [Docker Compose](https://docs.docker.com/compose/install/)

### Run

```
./stand_up_dev_env.sh -c
```

Allowed arguments
```
-c    Clean up before building.
-n    Skip building and deploying the UI.
```

Wait for all containers to have finished building, the final few lines should be similar to below

```
CONTAINER ID        IMAGE                 COMMAND                  CREATED             STATUS                  PORTS                                      NAMES
4b0fef5c8f33        deploy_nginx          "nginx -g 'daemon off"   1 seconds ago       Up Less than a second   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   deploy_nginx_1
c1a74ea7d853        deploy_proxy          "/srv/portal-proxy"      2 seconds ago       Up 1 seconds            443/tcp, 0.0.0.0:3003->3003/tcp            deploy_proxy_1
355ded0febec        deploy_goose          "/bin/sh -c 'bash /sr"   3 seconds ago       Up 2 seconds                                                       deploy_goose_1
de98a4420d58        susetest/uaa:latest   "/tomcat/bin/catalina"   5 seconds ago       Up 2 seconds            8080/tcp                                   deploy_uaa_1
dfbcd3ea0dbb        postgres:latest       "docker-entrypoint.sh"   5 seconds ago       Up 2 seconds            0.0.0.0:5432->5432/tcp                     deploy_postgres_1

```

The Web UI is served via deploy_nginx and should now be available after a short amount of time at https://localhost

### Stop/Cleanup

```
./cleanup-docker-compose.sh
```

Will stop and remove all console containers

### Useful commands

```
# Get a list of failed containers
$ sudo docker ps -a
  
# Get the log of a specific container
$ docker logs 4499d41872a2
   
# SSH into the running container
$ docker exec -it 4499d41872a2 /bin/bash
  
# Inspect a container to view ENV vars, etc.
$ sudo docker inspect 4499d41872a2
```

### Helpful Tools

We've created a few tools to help with other general stuff.

#### Add environment variables to the containers
Make a copy of

```development.rc.template```

, rename as 

```development.rc```

and update with the required variables.

#### Restarting the backend container

```
tools/restart_proxy.sh
```

Destroys the existing backend container and rebuilds it.

#### Connecting to the postgres DB

```
tools/connect_postgres.sh
```

Connects you into the postgres DB so you can clean out bad old things.
