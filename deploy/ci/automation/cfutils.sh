
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

function killDockerContainer {
  local ANCESTOR=$1
  local ID=$(docker ps -q --filter "ancestor=${ANCESTOR}")

  if [ "${ID}" != "" ]; then
    echo "Killing docker container: ${ID}"
    docker kill ${ID}
  else
    echo "No existing running container: ${ANCESTOR}"
  fi
}

# Any test run could have been aborted, leaving remnants - clean them up
function clean_deployments {
  echo "Stopping any MySQL Database"
  MYSQL_DOCKER=$(docker ps -q --filter "ancestor=mysql:latest")
  if [ -n "$MYSQL_DOCKER" ]; then
    docker kill $MYSQL_DOCKER
    docker rm $MYSQL_DOCKER
  fi

  echo "Stopping any Postgres Database"
  PGSQL_DOCKER=$(docker ps -q --filter "ancestor=postgres:latest")
  if [ -n "$PGSQL_DOCKER" ]; then
    docker kill $PGSQL_DOCKER
    docker rm $PGSQL_DOCKER
  fi

  echo "Stopping previous Docker All-in-one (if any)"
  # Kill any existing docker all-in-one docker containers
  RUNNING=$(docker ps -q --filter "ancestor=stratos-aio:latest")
  if [ -n "$RUNNING" ]; then
    docker kill $RUNNING
    docker rm $RUNNING
  fi

  echo "Stopping previous Docker All-in-one Nightly (if any)"
  # Kill any existing docker all-in-one nightly docker containers
  RUNNING=$(docker ps -q --filter "ancestor=splatform/stratos")
  if [ -n "$RUNNING" ]; then
    docker kill $RUNNING
    docker rm $RUNNING
  fi

  # Delete existing Stratos instance if there is one
  echo "Deleting previous Stratos app from CF (if any)"
  cf delete -f -r console > /dev/null 2>&1

  # Kill all containers
  # echo "Killing all Docker containers"
  # docker kill $(docker ps -q) > /dev/null 2>&1
  # docker rm $(docker ps -a -q) > /dev/null 2>&1

  # Remove all images
  # echo "Removing docker images"
  # docker rmi $(docker images -q) -f > /dev/null 2>&1
}

# Need TEST_CONFIG_URL to be set
if [ -z "${TEST_CONFIG_URL}" ]; then
  echo "You must set TEST_CONFIG_URL to the URL for retrieving the test config (secrets) metadata"
  exit 1
fi

# Is the test config file a local file? (must be absolute path)
if [[ "${TEST_CONFIG_URL}" == /* ]]; then
  rm -f secrets.yaml
  cp "${TEST_CONFIG_URL}" secrets.yaml
else
  # Get the E2E config
  rm -f secrets.yaml
  curl -k ${TEST_CONFIG_URL} --output secrets.yaml
fi

CF_DOMAIN=${CF_DOMAIN-local.pcfdev.io}
if [ -z "${CF_URL}" ]; then
  CF_URL=https://api.${CF_DOMAIN}
fi
CF_USER=${CF_USER}
CF_PASSWORD=${CF_PASSWORD}

echo ${CF_URL}

cf login -a ${CF_URL} --skip-ssl-validation -u ${CF_USER} -p ${CF_PASSWORD} -o e2e -s e2e
cf buildpacks

if [ $? -ne 0 ]; then
  echo "Unable to list buildpacks - looks like a problem with the test Cloud Foundry"
  exit 1
fi

# Clean up any old organisations
clean_orgs

clean_deployments
