#!/bin/bash

echo "===================="
echo "Stratos CF Push Test"
echo "===================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRPATH}/cfutils.sh"

# We should be running in the Stratos GitHub folder

# Optionally bring up a database and create a user provided service for the database
ETH_DEVICE=$(ip -o link show | awk '{print $2,$9}' | grep UP | grep eth | sed -n 1p | cut -d: -f1)
HOST=$(ip -4 addr show $ETH_DEVICE | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
USERNAME=stratos_mysql
PASSWORD=stratos_mysql_passw0rd
DB_NAME=stratos_db

# Start up DB
if [ "$1" == "mysql" ]; then
  DB_TYPE=mysql
  PORT=3306
  echo "Using MYSQL database"
  echo "Starting MySQL Database..."
  docker kill $(docker ps -q --filter "ancestor=mysql:latest")
  DB_DOCKER_PID=$(docker run -d -p $PORT:3306 --env MYSQL_ROOT_PASSWORD=stratos mysql:latest --default-authentication-plugin=mysql_native_password)
  echo "Waiting for mysql"
  until mysql -h $HOST -uroot -pstratos -e "SHOW DATABASES;" &> /dev/null
  do
    printf "."
    sleep 2
  done

  mysql -u root -pstratos -h $HOST -e "CREATE DATABASE $DB_NAME;"
  mysql -u root -pstratos -h $HOST -e "CREATE USER '$USERNAME'@'$HOST' IDENTIFIED BY '$PASSWORD';"
  mysql -u root -pstratos -h $HOST -e "GRANT ALL PRIVILEGES ON * . * TO '$USERNAME'@'$HOST';"
  mysql -u root -pstratos -h $HOST -e "FLUSH PRIVILEGES;"
fi

if [ "$1" == "pgsql" ]; then
  DB_TYPE=pgsql
  PORT=5432
  echo "Using Postgres database"
  echo "Starting Postgres Database..."
  docker kill $(docker ps -q --filter "ancestor=postgres:latest")
  DB_DOCKER_PID=$(docker run -d -p $PORT:5432 --env POSTGRES_PASSWORD=stratos --env POSTGRES_DB=$DB_NAME --env POSTGRES_USER=$USERNAME postgres:latest)
fi

DB=stratos-${DB_TYPE}

# Push Stratos to the Cloud Foundry
# Delete existing service instance if there is one
cf delete -f -r console
cf ds -f $DB

CONFIG='{"dbname":"'$DB_NAME'","name":"'$DB_NAME'","username":"'$USERNAME'","password":"'$PASSWORD'","uri":"'${DB_TYPE}'://database","port":"'$PORT'","hostname":"'$HOST'"}'
echo "Creating user provided service for the database..."
cf cups ${DB} -p "'${CONFIG}'"

set -e

#echo "Fetching backend dependencies"
#npm run fetch-backend-deps

echo "Performing cf push of Stratos"
date

MANIFEST=manifest.push.yml
rm -rf $MANIFEST
# Create manifest file to turn off auto-reg
cp manifest.yml $MANIFEST

echo "    env:" >> $MANIFEST
echo "      SKIP_AUTO_REGISTER: true" >> $MANIFEST

# SSO
SUITE=""
if [ "$2" == "sso" ] || [ "$3" == "sso" ] ; then
  echo "      SSO_LOGIN: true" >> $MANIFEST
  SUITE=" --suite=sso"
  # Run the helper script to make sure the CF client is set up correctly
  "$DIRPATH/init-pcfdev-uaa.sh"
fi  

if [ -n "${DB_TYPE}" ]; then
  echo "    services:" >> $MANIFEST
  echo "    - $DB" >> $MANIFEST
fi

cat $MANIFEST

# Prebuild
if [ "$2" == "prebuild" ]; then
  echo "Pre-building UI ..."
  npm install
  npm run prebuild-ui
fi

# Push Stratos to the Cloud Foundry
cf push -f $MANIFEST
RET=$?

date

if [ $RET -ne 0 ]; then
  set +e
  echo "Push failed... showing recent log of the Stratos app"
  cf logs console --recent
  set -e
fi

# Get the E2E config
rm -f secrets.yaml
curl -k ${TEST_CONFIG_URL} --output secrets.yaml

rm -rf node_modules
npm install

# Clean the E2E reports folder
rm -rf ./e2e-reports
mkdir -p ./e2e-reports
export E2E_REPORT_FOLDER=./e2e-reports

# Run the E2E tests
"$DIRPATH/runandrecord.sh" https://console.local.pcfdev.io ${SUITE}
RET=$?

# If we had test failures then copy console log to reports folder
if [ $RET -ne 0 ]; then
  cf logs --recent console > "${E2E_REPORT_FOLDER}/console-app.log"
fi 

# Delete the app
cf delete -f -r console

rm $MANIFEST

# Stop the database server
if [ -n "$DB_DOCKER_PID" ]; then
  echo "Stopping database server..."
  docker kill $DB_DOCKER_PID
fi

set +e

echo "All done"

# Return exit code form the e2e tests
exit $RET
