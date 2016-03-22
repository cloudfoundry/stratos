#stratos-deploy

#### Requirements:
- All requirements for stratos-ui also apply (all dependencies plus repo's cloned in proper location).
- Docker-compose must also be installed.


#### Build
```
docker-compose build
```
If you prefer to have a development environment running where the stratos-ui repo will auto-update (via gulp watch), instead run this command:
```
docker-compose -f docker-compose.development.yml build
```

#### Run
```
docker-compose up
```

#### Or run in background
```
docker-compose up -d
```

Wait until the UI container finishing building (the `stratosdeploy_ui_1` container stop running), the Web UI should now be running on your docker host ID, usually 192.168.99.100.

#### Stop

If running in foreground, first do `Ctrl + C` to exit and then:
```
docker-compose stop
```

#### Cleanup containers
```
docker-compose rm -f $(docker-compose ps -a)
```
