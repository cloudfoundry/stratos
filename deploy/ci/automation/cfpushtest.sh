#!/bin/bash

echo "===================="
echo "Stratos CF Push Test"
echo "===================="

FULL_STATUS=$(cf pcfdev status)
echo "$FULL_STATUS"

STATUS=$(echo "$FULL_STATUS" | head -n 1 -)
if [ "$STATUS" == "Not Created" ]; then
  echo "PCF DEV not created... starting"
  cf pcfdev start -m 8192
else if [ "$STATUS" == "Stopped" ]; then
        echo "PCF DEV stopped... starting"
        cf pcfdev start
      else if [ "$STATUS" == "Suspended" ]; then
        echo "Resuming PCF DEV"
        cf pcfdev resume
    fi
  fi
fi

cf login -a https://api.local.pcfdev.io --skip-ssl-validation -u admin -p admin -o e2e -s e2e
cf apps

# We should be running in the Stratos GitHub folder

# Optionally bring up a database and create a user provided service for the database
HOST=$(ip -4 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
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
  #DB_DOCKER_PID=$(docker run -d -p $PORT:3306 --env MYSQL_ROOT_PASSWORD=stratos --env MYSQL_DATABASE=$DB_NAME --env MYSQL_USER=$USERNAME --env MYSQL_PASSWORD==$PASSWORD mysql:latest --default-authentication-plugin=mysql_native_password)

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
  # POSTGRES_PASSWORD, POSTGRES_USER< POSTGRES_DB
  DB_DOCKER_PID=$(docker run -d -p $PORT:5432 --env POSTGRES_PASSWORD=stratos --env POSTGRES_DB=$DB_NAME --env POSTGRES_USER=$USERNAME postgres:latest)
fi

DB=stratos-${DB_TYPE}

# Push Stratos to the Cloud Foundry
# Delete existing service instance if there is one
cf delete -f -r console
cf ds -f $DB

CONFIG='{"dbname":"'$DB_NAME'","name":"'$DB_NAME'","username":"'$USERNAME'","password":"'$PASSWORD'","uri":"'${DB_TYPE}'://database","port":"'$PORT'","hostname":"'$HOST'"}'
echo "HERE..."
echo $CONFIG

echo "Creating user provided service for the database..."
cf cups ${DB} -p "'${CONFIG}'"

set -e

echo "Performing cf push of Stratos"
date

MANIFEST=manifest.push.yml
rm -rf $MANIFEST
# Create manifest file to turn off auto-reg
cp manifest.yml $MANIFEST

echo "    env:" >> $MANIFEST
echo "      SKIP_AUTO_REGISTER: true" >> $MANIFEST

if [ -n "${DB_TYPE}" ]; then
  echo "    services:" >> $MANIFEST
  echo "    - $DB" >> $MANIFEST
fi

cat $MANIFEST

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

wget ${TEST_CONFIG_URL} -O secrets.yaml --no-check-certificate
echo "headless: true" >> secrets.yaml

rm -rf node_modules
npm install

# Clean the E2E reports folder
rm -rf ./e2e-reports
mkdir -p ./e2e-reports
export E2E_REPORT_FOLDER=./e2e-reports

# Run the E2E tests
./node_modules/.bin/ng e2e --dev-server-target= --base-url=https://console.local.pcfdev.io
RET=$?

# Delete the app
#cf delete -f -r console

rm $MANIFEST

# Stop the database server
if [ -n "$DB_DOCKER_PID" ]; then
  echo "Stopping database server..."
  docker kill $DB_DOCKER_PID
fi

# Pause the PCF Dev instance for now
cf pcfdev suspend

# Return exit code form the e2e tests
exit $RET
