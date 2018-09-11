#!/bin/bash

#
#
# Script to set up CF with the orgs, spaces, apps and services needed to run the Stratos E2E tests
#
# By default this script runs against PCF Dev. To use against another CF, manually login to that CF
# and run this script with the argument 'nologin'

if [ ! "$1" == "nologin" ]; then 
  cf login -a https://api.local.pcfdev.io --skip-ssl-validation -u admin -p admin -o system -s system
else
  # Check we are logged in
  cf apps
  if [ $? -ne 0 ]; then
    echo "You must use 'cf login' to login to your Cloud Foundry first."
    exit 1
  fi
fi

ORG=e2e
SPACE=e2e

function createOrgSpace() {
  local ORG=$1
  local SPACE=$2
  cf delete-org $ORG -f

  cf create-org $ORG
  cf target -o $ORG
  cf create-space $SPACE
  cf target -o $ORG -s $SPACE

  cf set-org-role admin $ORG OrgManager
  cf set-org-role user $ORG OrgManager

  cf set-space-role admin $ORG $SPACE SpaceManager
  cf set-space-role admin $ORG $SPACE SpaceDeveloper

  cf set-space-role user $ORG $SPACE SpaceManager
  cf set-space-role user $ORG $SPACE SpaceDeveloper
}

function createService() {
  NAME=$1

  cloneRepo "irfanhabib" "worlds-simplest-service-broker"

  APP_NAME="$NAME-service-broker"
  BASE_GUID=$(uuidgen)

  pushd cfpushtemp/worlds-simplest-service-broker
  cf push $APP_NAME --no-start -m 128M -k 256M
  popd

  # Set env vars
  cf set-env $APP_NAME "BASE_GUID" $BASE_GUID
  cf set-env $APP_NAME "CREDENTIALS" "{\"port\": \"4000\", \"host\": \"1.2.3.4\"}"
  cf set-env $APP_NAME "SERVICE_NAME" $NAME
  cf set-env $APP_NAME "SERVICE_PLAN_NAME" "shared"
  cf set-env $APP_NAME "TAGS" "simple,shared"

  # Start the service
  cf restart $APP_NAME

  REGEX="^routes:[[:space:]]*(.*)"
  ROUTE=$(cf app $APP_NAME | grep routes)

  if [[ $ROUTE =~ $REGEX ]]; then
    SERVICE_URL="https://${BASH_REMATCH[1]}"
  else
    echo "Failed to get URL for service"
    exit 1
  fi
}

function cloneRepo() {
  PROJECT=$1
  REPO=$2

  if [ ! -d "./cfpushtemp/$REPO" ]; then
    echo "Cloning: $PROJECT/$REPO"
    mkdir -p cfpushtemp
    pushd cfpushtemp
    git clone https://github.com/$PROJECT/$REPO
    popd
  fi  

}

function createServiceBroker() {

  NAME=$1
  SERVICE_APP_URL=$2
  local TYPE=$3

  ARGS=""
  if [ "$TYPE" -eq 0 ]; then
    echo "Creating space-scoped service"
    ARGS="--space-scoped"
  fi

  cf create-service-broker $NAME "admin" "admin" $SERVICE_APP_URL $ARGS

  if [ "$TYPE" -eq 1 ]; then
    echo "Creating public service"
    cf enable-service-access $NAME
  fi

  if [ "$TYPE" -eq 2 ]; then
    echo "Creating private service"
    cf enable-service-access $NAME -o $ORG
  fi

}

createOrgSpace "test-e2e" "test-e2e"
createOrgSpace "e2e" "e2e"

# Create Services for E2E Tests

# Create Test Service Broker in the e2e/e2e org/space
createService "public-service"
createServiceBroker "public-service" $SERVICE_URL 1

createService "private-service"
createServiceBroker "private-service" $SERVICE_URL 2

createService "space-scoped-service"
createServiceBroker "space-scoped-service" $SERVICE_URL 0


# Deploy Node env for log stream test

cloneRepo "irfanhabib" "node-env"
pushd cfpushtemp/node-env
cf push
popd 


# Deploy go-env for binding services

cloneRepo "irfanhabib" "go-env"
pushd cfpushtemp/go-env
cf push
popd 
