#!/usr/bin/env bash

echo "Starting MariaDB database for development"

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"
echo $STRATOS_PATH

docker stop stratos-db
docker rm stratos-db

IMAGE=mariadb:10.2.33

# The container can set up users and a new database via env vars
ID=$(docker run --name stratos-db -d -e MYSQL_DATABASE=stratosdb -e MYSQL_ROOT_PASSWORD=dbroot -e MYSQL_PASSWORD=strat0s -p 3306:3306 ${IMAGE})
echo "Launched container: $ID"
echo "Database started ... it may take a few seconds to complete initialization ..."
