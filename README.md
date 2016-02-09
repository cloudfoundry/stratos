#stratos-deploy
#### Requirements:
- All requirements for stratos-ui also apply (all dependencies plus repo's cloned in proper location).
- Docker-compose must also be installed.

#### Standup Stratos service using docker-compose
```
docker-compose up
```
#### To run in background
```
docker-compose up -d
```
Service should now be running on your docker host ID, usually 192.168.99.100.

#### Stop Stratos service
If running in foreground, first do Ctrl + C to exit and then:
```
docker-compose stop
```

### Cleanup containers
```
docker-compose rm -f $(docker-compose ps -a)
```
