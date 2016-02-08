#stratos-deploy
#### Requirements:
- All requirements for stratos-ui also apply (all dependencies plus repo's cloned in proper location).
- Docker-compose must also be installed.

#### Standup Stratos service using docker-compose
```
docker-compose up (-d)
Use -d to run in background
```
Service should now be running on 192.168.99.100.

#### Stop Stratos service
If running in foreground, first do Ctrl + C to exit and then:
```
docker-compose stop
```

### Cleanup containers
```
docker-compose rm -f $(docker-compose ps -a)
```
