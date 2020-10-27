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
  cf buildpacks &> /dev/null
  if [ $? -ne 0 ]; then
    echo "You must use 'cf login' to login to your Cloud Foundry first."
    exit 1
  fi
fi


echo "Removing old Apps/Services/Orgs from E2E Tests"
echo "=============================================="

cf api

# Platform name (Linux, Darwin etc)
unamestr=`uname`

DRYRUN="false"
if [ "$1" == "-d" -o  "$2" == "-d" ]; then
  DRYRUN="true"
  echo "Dry run - will not delete anything"
fi

function clean() {
  local ITEMS=$1
  local PREFIX=$2
  local CMD=$3
  local REGEX=""
  local NOW=$(date "+%s")

  if [ -z "$4" ]; then
    local REGEX="^($PREFIX)(.*)\.([0-9\-]*)[Tt]([0-9:]*)([zZ]|\.[0-9]*z).*"
  else
    local REGEX="$4"
  fi

  while IFS= read -r line
  do
    if [ -z "$5" ]; then
      NAME="${line%% *}"
    else
      NAME="${line}"
    fi

    if [[ $NAME =~ $REGEX ]]; then
      DS="${BASH_REMATCH[3]}"
      DS=${DS//_/}
      DS=${DS//-/}
      TS="${BASH_REMATCH[4]}"
      TS=${TS//_/}
      TS=${TS//:/}
      TS="${TS:0:6}"

      if [[ "$unamestr" == 'Darwin' ]]; then
        EPOCH=$(date -j -f "%Y%m%d:%H%M%S" "$DS:$TS" "+%s")
      else
        TIMESTAMP="$DS ${TS:0:2}:${TS:2:2}:${TS:4:2}"
        EPOCH=$(date -d "$TIMESTAMP" "+%s")
      fi
      DIFF=$(($NOW-$EPOCH))
      # Delete anything older than 2 hours
      if [ $DIFF -gt 7200 ]; then
        if [ $DRYRUN == "false" ]; then
          echo "$NAME  [DELETE]"
          cf $CMD $NAME -f
        else
          echo "$NAME  [DELETE - DRYRUN]"
        fi
      else
        echo "$NAME  [OK]"
      fi
    fi
  done <<< "$ITEMS"
}

echo "Cleaning old Orgs"
ORGS="$(cf orgs)"
clean "$ORGS" "acceptance\.e2e\." "delete-org"

cf target -o e2e -s e2e

echo "Cleaning old Applications in e2e org/space"
APPS="$(cf apps)"
# clean "$APPS" "acceptance\.e2e\..*\." "delete"
clean "$APPS" "acceptance\.e2e\." "delete"

echo "Cleaning old Service Instances in e2e org/space"
SERVICES="$(cf services)"
clean "$SERVICES" "acceptance\.e2e\." "delete-service"

cf target -o e2e
echo "Cleaning old Spaces in e2e org"
SPACES="$(cf spaces)"
clean "$SPACES" "acceptance\.e2e\." "delete-space"

# Users
echo "Cleaning test Users"
USERS=$(cf space-users e2e e2e | grep "accept" | sed -e 's/^[[:space:]]*//')
clean "$USERS" "-" "delete-user" "^(acceptancee2etravis)(invite[0-9])(20[0-9]*)[Tt]([0-9]*)[zZ].*"

# user -a with org users so we get all users (including those without roles)
USERS=$(cf org-users -a e2e | grep "accept" | sed -e 's/^[[:space:]]*//')
clean "$USERS" "-" "delete-user" "^(acceptancee2etravis)(invite[0-9])(20[0-9]*)[Tt]([0-9]*)[zZ].*"

# Users without roles
echo "Cleaning users without roles"
USERS=$(cf curl "/v2/users?results-per-page=100" | jq -r .resources[].entity.username)
clean "$USERS" "-" "delete-user" "^(acceptance\.e2e\.travisci)(-remove-users)\.(20[0-9]*)[Tt]([0-9]*)[zZ].*"
clean "$USERS" "-" "delete-user" "^(acceptance\.e2e\.travis)(-remove-users)\.(20[0-9]*)[Tt]([0-9]*)[zZ].*"
clean "$USERS" "-" "delete-user" "^(acceptancee2etravis)(invite[0-9])(20[0-9]*)[Tt]([0-9]*)[zZ].*"
clean "$USERS" "-" "delete-user" "^(acceptance\.e2e\.travisci)(-manage-by-username)\.(20[0-9]*)[Tt]([0-9]*)[zZ].*"

# Routes
echo "Cleaning routes"
ROUTES=$(cf curl "v2/routes?results-per-page=100&inline-relations-depth=2&include-relations=domain" | jq -r '.resources[].entity | .domain.entity.name + " --hostname=" + .host + " --path=" + .path')
clean "$ROUTES" "-" "delete-route" "([0-9a-z\.])*( --hostname=acceptance_e2e_travisci_)(20[0-9_]*)[Tt]([0-9_]*)[zZ].*" "true"
clean "$ROUTES" "-" "delete-route" "([0-9a-z\.])*( --hostname=acceptance_e2e_travis_)(20[0-9_]*)[Tt]([0-9_]*)[zZ].*" "true"

echo "Done"

# Get users without usernames
#cf curl "/v2/users?results-per-page=10" | jq '.resources[] | { "username": .entity.username, "guid": .metadata.guid, "created": .metadata.created_at }' | jq 'select(.username==null)' | jq '. | select(.guid|match("^[0-9a-z]*-[0-9a-z]*-[0-9a-z]*[0-9a-z]*"))'
