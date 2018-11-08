
function clean_orgs {

ORGS=$(cf orgs | tail -n +3)
echo "Cleaning up orgs"

while read -r ORG; do
 if [[ $ORG == acceptance.e2e.* ]]; then
   echo "Deleting org: $ORG"
   cf delete-org $ORG -f
 fi
done <<< "$ORGS"

}

# Any test run could have been aborted, leaving remnants - clean them up
function clean_deployments {
  echo "Stopping any MySQL Database"
  MYSQL_DOCKER=$(docker ps -q --filter "ancestor=mysql:latest")
  if [ -n "$MYSQL_DOCKER" ]; then
    docker kill $MYSQL_DOCKER
  fi

  echo "Stopping previous Docker Compose (if any)"
  pushd deploy
  docker-compose -f docker-compose.development.yml down
  popd

  echo "Stopping previous Docker All-in-one (if any)"
  # Kill any existing docker all-in-one docker containers
  RUNNING=$(docker ps -q --filter "ancestor=stratos-aio:latest")
  if [ -n "$RUNNING" ]; then
    docker kill $RUNNING
  fi

  echo "Stopping previous Docker All-in-one Nightly (if any)"
  # Kill any existing docker all-in-one nightly docker containers
  RUNNING=$(docker ps -q --filter "ancestor=splatform/stratos")
  if [ -n "$RUNNING" ]; then
    docker kill $RUNNING
  fi

  # Delete existing Stratos instance if there is one
  echo "Deleting previous Stratos app from CF (if any)"
  cf delete -f -r console > /dev/null 2>&1

  # Kill all containers
  echo "Killing all Docker containers"
  docker kill $(docker ps -q) > /dev/null 2>&1
  docker rm $(docker ps -a -q) > /dev/null 2>&1

  # Remove all images
  echo "Removing docker images"
  docker rmi $(docker images -q) -f > /dev/null 2>&1
}

# Need TEST_CONFIG_URL to be set
if [ -z "${TEST_CONFIG_URL}" ]; then
  echo "You must set TEST_CONFIG_URL to the URL for retrieving the test config (secrets) metadata"
  exit 1
fi

FULL_STATUS=$(cf pcfdev status)
echo "$FULL_STATUS"

STATUS=$(echo "$FULL_STATUS" | head -n 1)
if [ "$STATUS" == "Not Created" ]; then
  echo "PCF DEV not created... starting"
  cf pcfdev start -m 10240 -c 3
else if [ "$STATUS" == "Running" ]; then
  echo "PCF DEV is already running"
  else if [ "$STATUS" == "Stopped" ]; then
    echo "PCF DEV stopped... starting"
    cf pcfdev start
    else if [ "$STATUS" == "Suspended" ]; then
      echo "Resuming PCF DEV"
      cf pcfdev resume
      else
        echo "Stopping and starting PCF DEV"
        cf pcfdev stop
        cf pcfdev start
      fi
    fi
  fi
fi

# Wait 5 seconds for PCFDev
sleep 5

cf login -a https://api.local.pcfdev.io --skip-ssl-validation -u admin -p admin -o e2e -s e2e
cf apps

if [ $? -ne 0 ]; then
  echo "Unable to list apps - looks like a problem with PCFDev"
  exit 1
fi

# Clean up any old organisations
clean_orgs

clean_deployments
