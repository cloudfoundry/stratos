#stratos-deploy

#### Requirements:
- All requirements for stratos-ui also apply (all dependencies plus repo's cloned in proper location).
- Docker-compose must also be installed.


#### Build
```
docker-compose build
```

#### Run
```
docker-compose up
```

#### Or run in background
```
docker-compose up -d
```

#### DB migration
exec into stratosdeploy_db_1 and run
```
mysql -u stratos --password=stratos < /versions/0.0.1.sql
mysql -u stratos --password=stratos < /versions/add_some_data.sql
```

Service should now be running on your docker host ID, usually 192.168.99.100.

#### Stop

If running in foreground, first do Ctrl + C to exit and then:
```
docker-compose stop
```

#### Cleanup containers
```
docker-compose rm -f $(docker-compose ps -a)
```
