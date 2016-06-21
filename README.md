# Stratos Deploy

## Building the Console for HCP

```
./build_and_tag.sh
```

This script supports the following optional arguments:

```
-t TAG_NAME
-r REGISTRY_ADDRESS
```

The default for TAG_NAME is a ISO-8601-like timestamp, of `YYYYmmddTHHMMSSZ`

The default for REGISTRY_ADDRESS is `docker-registry.helion.space:443`

This will build all of the images for the console, and creates a folder called `output` that contains
a HCP service definition and instance definition that refer to the specific registry and tag created
during this build.

**Note:** If you're doing local development, against your local registry, the generated service and
instance definition should not be distributed, as they do not refer to a generally accessible Docker
registry!

## Deploying the Console locally via Docker Compose

### Requirements:
- All requirements for stratos-ui also apply (all dependencies plus repo's cloned in proper location).
- Docker-compose must also be installed.


### Build
```
docker-compose build
```
If you prefer to have a development environment running where the stratos-ui repo will auto-update (via gulp watch), instead run this command:
```
docker-compose -f docker-compose.development.yml build
```

### Run
```
docker-compose -f docker-compose.development.yml up
```

### Or run in background
```
docker-compose -f docker-compose.development.yml up -d
```

Wait until the UI container finishing building (the `stratosdeploy_ui_1` container stop running), the Web UI should now be running on your docker host ID, discoverable via `docker-machine ip [machine-name]`

### Stop

If running in foreground, first do `Ctrl + C` to exit and then:
```
docker-compose stop
```

### Cleanup containers
```
docker-compose rm -f
```

## Deploying the Console against the dev harness (UCP/HCP)

1. Be sure and requisite projects are up to date/on the correct branch

2. Build your images and push them to the shared registry
```
cd build
./build_docker_images.sh
```

3. Deploy them against the dev harness
```
cd build/ucp
./deploy_and_wait_until_running.sh
```

4. Tear down the Console
```
# Get the port
$ curl -Ss http://192.168.200.2:8080/api/v1/namespaces/ucp/services/ipmgr | jq '.spec.ports[0].nodePort'

# Tear down the Console using the port
$ curl -X DELETE http://192.168.200.3:<port>/v1/instances/cnapconsole
```

## Useful commands

1. List Registry contents
```
$  curl -X GET https://docker-registry.helion.space/v2/_catalog
```

2. Tear down the Console specific components vs restarting the entire dev harness
```
# Get the port
$ curl -Ss http://192.168.200.2:8080/api/v1/namespaces/ucp/services/ipmgr | jq '.spec.ports[0].nodePort'

# Tear down the Console using the port
$ curl -X DELETE http://192.168.200.3:<port>/v1/instances/cnapconsole
```

3. To see more details information than what the Kubernetes Dashboard provides

```
# SSH to the node VM
$ vagrant ssh node

# Get a list of failed containers
node$ sudo docker ps -a

# Get the log of a specific container
node$ docker logs 4499d41872a2

# Inspect a container to view ENV vars, etc.
node$ sudo docker inspect d48da0be6e66
```

# Helpful Tools

We've created a few tools to help with other general stuff.

1. Creating a vmware docker-machine
```
tools/create-vmware-docker-machine.sh
```
Creates a vmware based docker-machine and adjusts it's networking to use NFS instead of the standard vmware sharing.

2. Restarting the portal-proxy container
```
tools/restart_proxy.sh
```
Destroys the existing portal-proxy container and rebuilds it.
