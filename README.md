# Stackato Deploy

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

This will build all of the images for the console, and creates a folder called `output` that contains a HCP service definition and instance definition that refer to the specific registry and tag created during this build.

**Note:** If you're doing local development, against your local registry, the generated service and instance definition should not be distributed, as they do not refer to a generally accessible Docker registry!

## Deploying the Console locally via Docker Compose

### Requirements:
- All requirements for stratos-ui also apply (all dependencies plus repo's cloned in proper location).
- Docker-compose must also be installed.


### Run

```
./stand_up_dev_env.sh -c
```
Wait until the UI container finishing building (the `stratosdeploy_ui_1` container stop running), the Web UI should now be running on your docker host ID, discoverable via `docker-machine ip [machine-name]`

### Stop/Cleanup

```
./cleanup-docker-compose.sh
```

## Deploying the Console against the a local HCP dev harness

1. Be sure all requisite projects are up to date/on the correct branch
    - stratos-deploy
    - helion-ui-framework
    - stratos-ui
    - portal-proxy

2. Build your images and SDL/IDL and push them to the shared registry

  ```
  ./build_and_tag.sh
  ```

3. Update any required placeholders in your IDL:

  a. Grab the service definition (SDL) and instance definition (IDL) json files for a specific build. Typically, these are located in the HSM bucket on Amazon AWS S3.

  b. If you haven't already done so, you will need to register your instance of the Console with GitHub.  Once your application is registered with GitHub, you will be have a client id & client secret associated with that application.

  c. The SDL file (sdl.json) is ready to be used without changes.

  d. Open the IDL file (instance.json) and scroll to the bottom. Replace the two values you see there with your GitHub OAuth `client ID` and `client secret`.

4. Deploy them against the dev harness

  ```
  ./deploy_and_wait_until_running.sh
  ```

5. Tear down the Console (not sure this is up to date)

  ```
  # Get the port
  $ curl -Ss http://192.168.200.2:8080/api/v1/namespaces/ucp/services/ipmgr | jq '.spec.ports[0].nodePort'

  # Tear down the Console using the port
  $ curl -X DELETE http://192.168.200.3:<port>/v1/instances/cnapconsole
  ```

## Deploying the Console against a non-local HCP dev harness (AWS, etc.)

1. Grab the service definition (SDL) and instance definition (IDL) json files for a specific build. Typically, these are located in the HSM bucket on Amazon AWS S3.

2. If you haven't already done so, you will need to register your instance of the Console with GitHub.  Once your application is registered with GitHub, you will be have a client id & client secret associated with that application.

3. The SDL file (sdl.json) is ready to be used without changes.

4. Open the IDL file (instance.json) and scroll to the bottom.

  a. Replace "\__REPLACE_WITH_OAUTH_CLIENT_ID\__" with your GitHub registered client id.

  b. Replace "\__REPLACE_WITH_OAUTH_CLIENT_SECRET\__" with your GitHub registered client secret.

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

3. Connecting to the postgres DB

  ```
  tools/connect_postgres.sh
  ```

  Connects you into the postgres DB so you can clean out bad old things.  :-)
 
