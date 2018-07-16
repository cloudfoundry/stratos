echo "===================="
echo "Stratos CF Push Test"
echo "===================="

FULL_STATUS=$(cf pcfdev status)
echo "$FULL_STATUS"

STATUS=$(echo "$FULL_STATUS" | head -n 1 -)
echo "$STATUS"

if [ "$STATUS" == "Not Created" ]; then
  echo "PCF DEV not created... starting"
  cf pcfdev start -m 8192
else if [ "$STATUS" == "Suspended" ]; then
  echo "Resuming PCF DEV"
  cf pcfdev resume
fi
fi

cf login -a https://api.local.pcfdev.io --skip-ssl-validation -u admin -p admin -o e2e -s e2e
cf apps

# We should be running in the Stratos GitHub folder

# Optionally bring up a database and create a user provided service for the database
if [ "$1" == "mysql" ]; then
  DB_TYPE=mysql
  echo "Using MYSQL database"
fi

DB=stratos-${DB_TYPE}
HOST=$(ip -4 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
PORT=54321
USERNAME=stratos_mysql
PASSWORD=stratos_mysql_passw0rd
DB_NAME=stratos_db

echo "Creating user provided service for the database..."
cf cups ${DB} -p '{"dbname":"$DB_NAME","name":"$DB_NAME","username":"$USERNAME","password":"$PASSWORD","uri":"${DB_TYPE}://database","port":"$PORT","hostname":"$HOST"}'

echo "Performing cf push of Stratos"
date

set -e

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

# Start up DB
if [ -n "${DB}" ]; then
  echo "Starting MySQL Database..."
  DB_DOCKER_PID=$(docker run -d -p $PORT:3306 --env MYSQL_ROOT_PASSWORD=stratos --env MYSQL_DATABASE=$DB_NAME --env MYSQL_USER=$USERNAME --env MYSQL_PASSWORD==$PASSWORD mysql:latest)
fi

# Push Stratos to the Cloud Foundry
cf push -f $MANIFEST
date

wget ${TEST_CONFIG_URL} -O secrets.yaml --no-check-certificate

npm install

# Clean the E2E reports folder
rm -rf ./e2e-reports
mkdir -p ./e2e-reports
export E2E_REPORT_FOLDER=./e2e-reports

# Run the E2E tests
set +e
./node_modules/.bin/ng e2e --dev-server-target= --base-url=https://console.local.pcfdev.io
RET=$?

# Delete the app
cf delete -f -r console

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

