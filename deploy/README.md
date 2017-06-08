# Stratos UI Console Deploy

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

# Helpful Tools

We've created a few tools to help with other general stuff.

1. Restarting the portal-proxy container

  ```
  tools/restart_proxy.sh
  ```

  Destroys the existing portal-proxy container and rebuilds it.

2. Connecting to the postgres DB

  ```
  tools/connect_postgres.sh
  ```

  Connects you into the postgres DB so you can clean out bad old things.  :-)
 
