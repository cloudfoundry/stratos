#!/usr/bin/env bash

echo "Startind Postgres database for development"

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"
echo $STRATOS_PATH

docker stop stratos-db
docker rm stratos-db

ID=$(docker run --name stratos-db -d -e POSTGRES_DB=stratosdb -e POSTGRES_USER=stratos -e POSTGRES_PASSWORD=strat0s -p 5432:5432 postgres)
echo $ID

echo "Just waiting a few seconds for the DB to come online ..."
sleep 5

echo "Database ready"
