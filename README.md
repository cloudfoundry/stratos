# Stratos Deploy

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
docker-compose up
```

### Or run in background
```
docker-compose up -d
```

Wait until the UI container finishing building (the `stratosdeploy_ui_1` container stop running), the Web UI should now be running on your docker host ID, usually 192.168.99.100.

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
