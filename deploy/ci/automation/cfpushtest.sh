#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN="\033[96m"
YELLOW="\033[93m"
BOLD="\033[1m"
RESET='\033[0m'

echo "===================="
echo "Stratos CF Push Test"
echo "===================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRPATH}/cfutils.sh"

# We should be running in the Stratos GitHub folder

# Optionally bring up a database and create a user provided service for the database
if [ -z "${DATABASE_HOST}" ]; then
  ETH_DEVICE=$(ip -o link show | awk '{print $2,$9}' | grep UP | grep eth | sed -n 1p | cut -d: -f1)
  HOST=$(ip -4 addr show $ETH_DEVICE | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
else
  HOST=${DATABASE_HOST}
  echo "Database host is ${HOST}"
fi

USERNAME=stratos_mysql
PASSWORD=stratos_mysql_passw0rd
DB_NAME=stratos_db

# Start up DB
if [ "$1" == "mysql" ]; then
  DB_TYPE=mysql
  PORT=3306
  echo "Using MYSQL database"
  echo "Starting MySQL Database..."
  killDockerContainer "mysql:latest"
  DB_DOCKER_PID=$(docker run -d -p $PORT:3306 --env MYSQL_ROOT_PASSWORD=stratos mysql:latest --default-authentication-plugin=mysql_native_password)
  echo "Waiting for mysql"
  until mysql -h $HOST -uroot -pstratos -e "SHOW DATABASES;" &> /dev/null
  do
    printf "."
    sleep 2
  done

  echo ""

  echo "Creating database and setting permissions..."
  mysql -uroot -pstratos -h $HOST -e "CREATE DATABASE $DB_NAME;"
  mysql -uroot -pstratos -h $HOST -e "CREATE USER '$USERNAME'@'%' IDENTIFIED BY '$PASSWORD';"
  mysql -uroot -pstratos -h $HOST -e "GRANT ALL PRIVILEGES ON * . * TO '$USERNAME'@'%';"
  mysql -uroot -pstratos -h $HOST -e "FLUSH PRIVILEGES;"
fi

if [ "$1" == "pgsql" ]; then
  DB_TYPE=pgsql
  PORT=5432
  echo "Using Postgres database"
  echo "Starting Postgres Database..."
  killDockerContainer "postgres:latest"
  USERNAME=stratos_pgsql
  PASSWORD=stratos_pgsql_passw0rd
  DB_DOCKER_PID=$(docker run -d -p $PORT:5432 --env POSTGRES_PASSWORD=${PASSWORD} --env POSTGRES_DB=$DB_NAME --env POSTGRES_USER=$USERNAME postgres:latest)
fi

DB=stratos-${DB_TYPE}

# Push Stratos to the Cloud Foundry
# Delete existing service instance if there is one
cf delete -f -r console
cf ds -f $DB

if [ -n "${DB_TYPE}" ]; then
  CONFIG='{"dbname":"'$DB_NAME'","name":"'$DB_NAME'","username":"'$USERNAME'","password":"'$PASSWORD'","uri":"'${DB_TYPE}'://database","port":"'$PORT'","hostname":"'$HOST'"}'
  echo "Creating user provided service for the database..."
  echo "Database Server: ${HOST}:${PORT}"
  cf cups ${DB} -p "'${CONFIG}'"
  echo ${CONFIG}
fi

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
echo "      FORCE_ENABLE_PERSISTENCE_FEATURES: true" >> $MANIFEST

# Make sure we add invite users config if set
if [ -n "${SMTP_HOST}" ]; then
  echo "      SMTP_HOST: ${SMTP_HOST}" >> $MANIFEST
fi

if [ -n "${SMTP_FROM_ADDRESS}" ]; then
  echo "      SMTP_FROM_ADDRESS: ${SMTP_FROM_ADDRESS}" >> $MANIFEST
fi

# SSO
SUITE=""
if [ "$2" == "sso" ] || [ "$3" == "sso" ] ; then
  echo "      SSO_LOGIN: true" >> $MANIFEST
  SUITE=" --suite=sso"
  # Run the helper script to make sure the CF client is set up correctly
  "$DIRPATH/init-uaa-for-sso.sh"
fi  

if [ -n "${DB_TYPE}" ]; then
  echo "    services:" >> $MANIFEST
  echo "    - $DB" >> $MANIFEST
fi

cat $MANIFEST

# Prebuild
if [ "$2" == "prebuild" ]; then
  echo -e "${CYAN}Pre-building UI ...${RESET}"
  npm install
  npm run prebuild-ui
fi

# If the push fails, we want to continue and show the logs
set +e

# Push Stratos to the Cloud Foundry
cf push -f $MANIFEST
RET=$?

date

if [ $RET -ne 0 ]; then
  set +e
  echo "Push failed... showing recent log of the Stratos app"
  cf logs --recent console
  set -e
else

  # Show the recent logs just we can see startup settings
  echo -e "${BOLD}${GREEN}Showing recent logs of the Stratos App${RESET}"
  cf logs --recent console | tail -n 100
  
  echo -e "${BOLD}${GREEN}"
  echo "==============================================================================="
  echo ""
  echo "Running E2E Tests...."
  echo -e "${RESET}"

  # Push was okay, so we can prepare and run E2E tests
  rm -rf node_modules
  npm install

  # Clean the E2E reports folder
  rm -rf ./e2e-reports
  mkdir -p ./e2e-reports
  export E2E_REPORT_FOLDER=./e2e-reports

  # Run the E2E tests
  "$DIRPATH/runandrecord.sh" https://console.${CF_DOMAIN} ${SUITE}
  RET=$?

  # If we had test failures then copy console log to reports folder
  if [ $RET -ne 0 ]; then
    cf logs --recent console > "${E2E_REPORT_FOLDER}/console-app.log"
  fi 
fi

# Clean up
rm $MANIFEST

# Stop the database server
if [ -n "$DB_DOCKER_PID" ]; then
  echo "Stopping database server..."
  docker kill $DB_DOCKER_PID
fi

set +e

# Delete the app - add one retry if it fails first time
cf delete -f -r console
if [ $? -ne 0 ]; then
  sleep 60
  cf delete -f -r console
fi

echo "All done"

# Return exit code form the e2e tests
exit $RET
