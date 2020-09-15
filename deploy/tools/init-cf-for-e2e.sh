#!/bin/bash

#
#
# Script to set up CF with the orgs, spaces, apps and services needed to run the Stratos E2E tests
#
# By default this script runs against PCF

ADMIN="admin"
ADMIN_PASS="admin"
USER="user"
USER_PASS="pass"
REMOVE_USER="e2e-remove-user"
SKIP_LOGIN="false"
CF_API_ENDPOINT="https://api.local.pcfdev.io"
#(CFDEV)CF_API_ENDPOINT="https://api.dev.cfdev.sh"
DEFAULT_ORG="e2e"
DEFAULT_SPACE="e2e"
SETUP_INVITE_USER="true"
UAA_CLI_CMD="uaac"
UAA_ENDPOINT="https://uaa.local.pcfdev.io"
#(CFDEV)UAA_ENDPOINT="https://uaa.dev.cfdev.sh"
#(SCF)UAA_ENDPOINT="https://uaa.cf.capbristol.com"
ADMIN_CLIENT_SECRET="admin-client-secret"
#(SCF)ADMIN_CLIENT_SECRET="<snip>"
UAA_ZONE=
#(SCF)UAA_ZONE=scf

while getopts ":a:p:u:i:c:l:b:d:e:f:g:" opt ; do
  case $opt in
    a)
      ADMIN="${OPTARG}"
    ;;
    p)
      ADMIN_PASS="${OPTARG}"
    ;;
    u)
      USER="${OPTARG}"
    ;;
    i)
      USER_PASS="${OPTARG}"
    ;;
    c)
      CF_API_ENDPOINT="${OPTARG}"
    ;;
    l)
      SKIP_LOGIN="true"
    ;;
    b)
      SETUP_INVITE_USER="${OPTARG}"
    ;;
    d)
      UAA_CLI_CMD="${OPTARG}"
    ;;
    e)
      UAA_ENDPOINT="${OPTARG}"
    ;;
    f)
      ADMIN_CLIENT_SECRET="${OPTARG}"
    ;;
    g)
      UAA_ZONE="${OPTARG}"
    ;;
  esac
done

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "${SKIP_LOGIN}" == "false" ]; then
  cf login -a $CF_API_ENDPOINT --skip-ssl-validation -u $ADMIN -p $ADMIN_PASS -o system -s system
fi

# Check we are logged in
cf buildpacks
if [ $? -ne 0 ]; then
  echo "You must use 'cf login' to login to your Cloud Foundry first."
  exit 1
fi

function createOrgSpace() {
  local ORG=$1
  local SPACE=$2
  cf delete-org $ORG -f

  cf create-org $ORG
  cf target -o $ORG
  cf create-space $SPACE
  cf target -o $ORG -s $SPACE

  cf set-org-role $ADMIN $ORG OrgManager
  cf set-org-role $USER $ORG OrgManager
  cf set-org-role $REMOVE_USER $ORG OrgManager

  cf set-space-role $ADMIN $ORG $SPACE SpaceManager
  cf set-space-role $ADMIN $ORG $SPACE SpaceDeveloper

  cf set-space-role $USER $ORG $SPACE SpaceManager
  cf set-space-role $USER $ORG $SPACE SpaceDeveloper

  cf set-space-role $REMOVE_USER $ORG $SPACE SpaceManager
  cf set-space-role $REMOVE_USER $ORG $SPACE SpaceDeveloper
}

function cloneRepo() {
  PROJECT=$1
  REPO=$2

  if [ ! -d "./cfpushtemp/$REPO" ]; then
    echo "Cloning: $PROJECT/$REPO"
    mkdir -p cfpushtemp
    pushd cfpushtemp
    git clone https://github.com/$PROJECT/$REPO
  else
    echo "Rebasing: $PROJECT/$REPO"
    pushd cfpushtemp/$REPO
    git pull --rebase
  fi
  popd
}

function addInviteUserUaaClient() {
  echo "Setting up UAA Client for invite user tests"
  
  ZONE_ARG=""
  if [ -n "${UAA_ZONE}" ]; then
    echo "UAA ZONE: ${UAA_ZONE}"
    ZONE_ARG="-z ${UAA_ZONE}"
  fi
  
  echo "UAA Endpoint: ${UAA_ENDPOINT}"
  ${UAA_CLI_CMD} target ${UAA_ENDPOINT} --skip-ssl-validation
  ${UAA_CLI_CMD} token client get admin -s ${ADMIN_CLIENT_SECRET}
  
  echo "Adding Client"
  ${UAA_CLI_CMD} client add stratos-invite --scope scim.invite,cloud_controller.admin --authorized_grant_types client_credentials --authorities scim.invite,cloud_controller.admin -s changeme ${ZONE_ARG}
}

cf create-user $USER $USER_PASS
cf create-user $REMOVE_USER $USER_PASS

createOrgSpace "test-e2e" "test-e2e"
createOrgSpace $DEFAULT_ORG $DEFAULT_SPACE

# Create Services for E2E Tests
"${DIRPATH}/populate-cf/create-services.sh" -n -o $DEFAULT_ORG -s $DEFAULT_SPACE -u $ADMIN -p $ADMIN_PASS

# Deploy go-env for binding services
cloneRepo "cf-stratos" "go-env"
pushd cfpushtemp/go-env
cf push
popd

if [ "${SETUP_INVITE_USER}" == "true" ]; then
  addInviteUserUaaClient
fi

# Enable docker for deploy app from docker test
cf enable-feature-flag diego_docker

# Enable features for testing add/remove role via username
cf enable-feature-flag set_roles_by_username
cf enable-feature-flag unset_roles_by_username

echo "All done"
