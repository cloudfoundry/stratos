#!/bin/bash

#
#
# Script to set up CF with the orgs, spaces, apps and services needed to run the Stratos E2E tests
#
# By default this script runs against PCF Dev. To use against another CF, manually login to that CF
# and run this script with the argument 'nologin'

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! "$1" == "nologin" ]; then 
  cf login -a https://api.local.pcfdev.io --skip-ssl-validation -u admin -p admin -o system -s system
else
  # Check we are logged in
  cf buildpacks
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

createOrgSpace "test-e2e" "test-e2e"
createOrgSpace "e2e" "e2e"

# Create Services for E2E Tests
"${DIRPATH}/populate-cf/create-services.sh" -n

# Deploy go-env for binding services
cloneRepo "cf-stratos" "go-env"
pushd cfpushtemp/go-env
cf push
popd

echo "All done"
